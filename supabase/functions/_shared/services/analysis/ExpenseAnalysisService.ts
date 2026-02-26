import type { AIProvider } from "../../config/ai-providers.ts";
import type { AIResponse } from "../../types/analysis.types.ts";
import { OpenAIService } from "../ai/OpenAIService.ts";
import { GeminiService } from "../ai/GeminiService.ts";
import { getAIProvider } from "../../config/ai-providers.ts";

export class ExpenseAnalysisService {
  private aiService: OpenAIService | GeminiService;

  constructor() {
    const provider = getAIProvider();
    console.log(`Initializing ExpenseAnalysisService with provider: ${provider}`);

    if (provider === "lovable" || provider === "openai") {
      this.aiService = new OpenAIService(provider);
    } else {
      this.aiService = new GeminiService(provider);
    }
  }

  async analyzeExpenseFile(
    base64Content: string,
    mimeType: string,
    isPDF: boolean,
    previousCategories: string[] = [],
    existingBuildingNames: string[] = []
  ): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(isPDF, previousCategories, existingBuildingNames);
    const prompt = this.getAnalysisPrompt(isPDF);

    const content = await this.aiService.generateContentWithImage(
      prompt,
      base64Content,
      mimeType,
      systemPrompt
    );

    return this.parseAIResponse(content);
  }

  async analyzeExpenseText(
    text: string,
    previousCategories: string[] = [],
    existingBuildingNames: string[] = []
  ): Promise<AIResponse> {
    const systemPrompt = this.getSystemPrompt(true, previousCategories, existingBuildingNames);

    // Protection against extremely large texts
    let truncatedText = text;
    if (text.length > 80000) {
      // Keep start and end of the document (usually contains totals and unit details)
      truncatedText = text.substring(0, 40000) + "\n...[CONTENIDO OMITIDO EN EL MEDIO PARA OPTIMIZAR]...\n" + text.substring(text.length - 40000);
    }

    const prompt = `Analizá esta liquidación de expensas (texto extraído por OCR). 
Tarea: Limpia errores de lectura, identifica montos (puntos/comas) y extrae los datos JSON.

TEXTO:
"""
${truncatedText}
"""

REGLAS DE SALIDA:
1. Devuelve ÚNICAMENTE el código JSON.
2. Sé conciso en el campo "explanation" de cada categoría para ahorrar espacio.
3. Asegurate de que el JSON esté completo y cierre correctamente.`;

    const content = await this.aiService.generateContent(
      prompt,
      systemPrompt
    );

    return this.parseAIResponse(content);
  }

  private validateCUIT(cuit: string | null): boolean {
    if (!cuit) return false;
    const cleanCuit = cuit.replace(/[^0-9]/g, '');
    if (cleanCuit.length !== 11) return false;

    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += parseInt(cleanCuit[i]) * multiplicadores[i];
    }

    const resto = suma % 11;
    let digitoEsperado = resto === 0 ? 0 : 11 - resto;
    if (digitoEsperado === 11) digitoEsperado = 0;

    // Special cases for modulo 11 in CUIT
    if (resto === 1) {
      if (cleanCuit.startsWith('20')) digitoEsperado = 9;
      else if (cleanCuit.startsWith('27')) digitoEsperado = 4;
      else digitoEsperado = 9;
    }

    return digitoEsperado === parseInt(cleanCuit[10]);
  }

  private parseAIResponse(content: string): AIResponse {
    let cleanedContent = content;

    // Log for debugging (truncated in console/logs is normal but helps see the start)
    console.log(`AI Response start: ${content.substring(0, 200)}...`);

    // Fixer: Clean invisible characters (zero-width spaces, etc.)
    cleanedContent = cleanedContent.replace(/[\u200B-\u200D\uFEFF]/g, '');

    cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
      cleanedContent = cleanedContent.slice(1, -1);
    }

    try {
      const data = JSON.parse(cleanedContent.trim());

      // Ensure subcategory sums match their parent category (granular data takes precedence)
      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((cat: any) => {
          if (cat.subcategories && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
            const subSum = cat.subcategories.reduce((sum: number, sub: any) => sum + (Number(sub.amount) || 0), 0);
            if (subSum > 0 && Math.abs(subSum - cat.current_amount) > 1) {
              console.warn(`Adjusting category ${cat.name} from ${cat.current_amount} to ${subSum}`);
              cat.current_amount = subSum;
            }
          }
        });

        // NOTE: We intentionally do NOT override total_amount with the categories sum.
        // If they diverge significantly it means the AI mixed scales (unit vs consorcio).
        // Log it for debugging but trust the AI's explicit total_amount field.
        const categoriesSum = data.categories.reduce((sum: number, cat: any) => sum + (Number(cat.current_amount) || 0), 0);
        if (categoriesSum > 0 && Math.abs(categoriesSum - data.total_amount) > (data.total_amount * 0.15)) {
          console.warn(`WARNING: categories sum (${categoriesSum}) differs >15% from total_amount (${data.total_amount}). Possible scale mix-up in AI response.`);
        }
      }

      // 1. Validation of Totales (Checksum Interno)
      if (data.total_amount && data.unit_coefficient && data.unit_amount) {
        const expectedUnitTotal = data.total_amount * data.unit_coefficient;
        const tolerance = 500; // Allow for rounding differences
        if (Math.abs(expectedUnitTotal - data.unit_amount) > tolerance) {
          console.warn(`CHECKSUM ERROR: Total Consorcio (${data.total_amount}) * Coef (${data.unit_coefficient}) = ${expectedUnitTotal} vs Unit Total reported (${data.unit_amount})`);
        }
      }

      // Control de Alucinaciones en CUITs
      if (data.administrator_cuit) {
        data.administrator_cuit_confirmed = this.validateCUIT(data.administrator_cuit);
      }

      if (data.categories && Array.isArray(data.categories)) {
        data.categories.forEach((cat: any) => {
          if (cat.subcategories && Array.isArray(cat.subcategories)) {
            cat.subcategories.forEach((sub: any) => {
              if (sub.provider_cuit) {
                sub.cuit_confirmed = this.validateCUIT(sub.provider_cuit);
              }
            });
          }
        });
      }

      return data;
    } catch (error) {
      console.error("JSON parsing error:", error);
      console.error("Cleaned content length:", cleanedContent.length);
      console.error("Original content length:", content.length);

      return {
        building_name: "Error en parsing",
        period: "Error",
        period_month: 1,
        period_year: 2024,
        unit: undefined,
        total_amount: 0,
        categories: [{
          name: "Error",
          icon: "alert",
          current_amount: 0,
          status: "attention",
          explanation: "La respuesta de la IA fue demasiado larga o se cortó."
        }],
        building_profile: {
          country: "Argentina",
          province: null,
          city: null,
          neighborhood: null,
          zone: null,
          unit_count_range: null,
          age_category: null,
          has_amenities: false,
          amenities: []
        }
      };
    }
  }

  private getSystemPrompt(
    isPDF: boolean | string,
    previousCategories: string[] = [],
    existingBuildingNames: string[] = []
  ): string {
    const categoriesGuide = previousCategories.length > 0
      ? `\nGUÍA DE CATEGORÍAS PREVIAS (Usa estos nombres si el concepto es el mismo):\n${previousCategories.map(c => `- ${c}`).join('\n')}\n`
      : "";

    const buildingGuide = existingBuildingNames.length > 0
      ? `\nGUÍA DE EDIFICIOS EXISTENTES (Si el edificio es uno de estos, usa el nombre EXACTO):\n${existingBuildingNames.map(b => `- ${b}`).join('\n')}\n`
      : "";

    return `Eres un experto en liquidaciones de expensas argentinas. Devuelve ÚNICAMENTE JSON plano sin texto adicional.
${buildingGuide}${categoriesGuide}
═══════════════════════════════════════════════════════════════
REGLA 1 — TOTAL DEL CONSORCIO vs TOTAL POR UNIDAD (CRÍTICO)
═══════════════════════════════════════════════════════════════
Las expensas argentinas muestran DOS totales distintos:
  • "Total del Consorcio" o "Total General": suma de TODO el edificio (ej: $14.500.000)
  • "Total por Unidad" o "Tu expensa" o "Importe a pagar": lo que paga UN departamento (ej: $127.000)

REGLA DE ORO: Debes extraer el TOTAL DEL CONSORCIO (no el de la unidad).
  - El campo "total_amount" SIEMPRE debe ser el total del consorcio completo.
  - Las categorías (Personal, Mantenimiento, etc.) también deben ser del consorcio.
  - El campo "unit" es el número de unidad funcional (ej: "3B") si aparece.
  - NUNCA reportes el importe por unidad como total_amount.
  ✓ CORRECTO: total_amount = 14.500.000 (aunque la expensa de la unidad sea $127.000)
  ✗ INCORRECTO: total_amount = 127.000

 Para identificar cuál es cuál:
  - El total del consorcio suele estar en la página de detalle general, en mayúsculas: "TOTAL GENERAL", "TOTAL CONSORCIO"
  - El total por unidad suele decir: "Total a pagar", "Importe", "Deuda", "Su expensa", y es proporcional al coeficiente de la unidad

═══════════════════════════════════════════════════════════════
REGLA 2 — ALINEACIÓN HORIZONTAL Y TABLAS (ESTRUCTURAL)
═══════════════════════════════════════════════════════════════
- El texto que recibes fue extraído usando una GRILLA ESPACIAL estricta. Conserva la tabulación y alineación exacta del PDF original.
- Si ves largas cadenas de espacios en blanco, significa que hay un salto real de columna.
- ES CRÍTICO asegurar que el "amount" que extraes sea el de la misma fila horizontal que el concepto. NO saltes de línea.
- Si una descripción ocupa 2 o 3 líneas, el monto suele estar alineado en la columna de la derecha sobre la PRIMERA o ÚLTIMA línea del texto de descripción.
- NUNCA asocies el importe de una fila inferior a un proveedor de arriba.
- Utiliza la alineación vertical de los números (columnas) para distinguir "Erogaciones/Gastos" de "Saldos Adicionales".

═══════════════════════════════════════════════════════════════
REGLA 3 — CONCEPTOS NEGATIVOS (CRÍTICO)
═══════════════════════════════════════════════════════════════
- Identifica montos que RESTAN (notas de crédito, bonificaciones, descuentos, devoluciones).
- Busca símbolos "-" o palabras: "Crédito", "Bonificación", "Descuento", "Devolución".
- Estos deben ser valores NEGATIVOS en el JSON.

═══════════════════════════════════════════════════════════════
REGLA 4 — DISTINCIÓN DE COLUMNAS (GASTO vs SALDO)
═══════════════════════════════════════════════════════════════
- IGNORA las columnas de "Saldo Anterior", "Intereses por Mora" o "Deuda".
- Extrae SOLO los montos de la columna de "Gasto", "Erogación" o "Cuota del Mes".

═══════════════════════════════════════════════════════════════
REGLA 5 — CLASIFICACIÓN SEMÁNTICA (IMPORTANTE)
═══════════════════════════════════════════════════════════════
- "SUTERH", "AFIP", "Cargas Sociales", "FATERYH" -> Categoría "Sueldos y Cargas Sociales", type "personal"
- "Metrogas", "Naturgy" -> Categoría "Servicios Públicos", type "gas"
- "Edesur", "Edenor" -> Categoría "Servicios Públicos", type "electricidad"
- "AySA" -> Categoría "Servicios Públicos", type "agua"

═══════════════════════════════════════════════════════════════
REGLA 6 — IDENTIFICACIÓN DEL EDIFICIO vs ADMINISTRACIÓN
═══════════════════════════════════════════════════════════════
- El building_name es el CONSORCIO (ej: "CONSORCIO PUEYRREDON 1234").
- EXCLUYE nombres de "Estudios", "Administradoras" o "Liquidadores" de este campo.

═══════════════════════════════════════════════════════════════
REGLA 7 — EXTRACCIÓN LÍNEA POR LÍNEA (SIN EXCEPCIONES)
═══════════════════════════════════════════════════════════════
- CADA ÚNICA línea de gasto en el PDF DEBE ser una subcategoría independiente.
- ESTÁ PROHIBIDO AGRUPAR. Si hay 5 facturas de mantenimiento, reporta 5 subcategorías. 
- Copia el nombre del proveedor o concepto exactamente como aparece.

═══════════════════════════════════════════════════════════════
REGLA 8 — DETECCIÓN DE GASTOS EXTRAORDINARIOS
═══════════════════════════════════════════════════════════════
- Marca con expense_type: "extraordinaria" TODO gasto que diga "Extraordinaria", "Obra", "Mejora", "Juicio", "Indemnización".
- Úsalo también para arreglos grandes (ej: reparación de caldera, pintura de fachada).

═══════════════════════════════════════════════════════════════
REGLA 9 — INSIGHTS Y ALERTAS PARA EL USUARIO
═══════════════════════════════════════════════════════════════
- Si detectas algo inusual (sobreprecio, multas, intereses por mora en servicios públicos), explícalo en "explanation".
- Empatiza con el usuario: "Atención: se pagó una multa por falta de matafuegos."
- Cambia el status de la categoría a "attention".

═══════════════════════════════════════════════════════════════
REGLA 10 — VERIFICACIÓN MATEMÁTICA (AUTOCORRECCIÓN)
═══════════════════════════════════════════════════════════════
- El "current_amount" de cada categoría DEBE ser la suma EXACTA de todas sus subcategorías.
- Si no coinciden, es una señal de que omitiste extraer líneas del PDF. Revisalo antes de responder.


JSON Schema a devolver:
{
  "building_name": string,
  "building_address": string | null,
  "period": string,
  "period_month": number (1-12),
  "period_year": number (YYYY),
  "unit": string | null,
  "unit_amount": number | null,
  "unit_coefficient": number | null,
  "total_amount": number,
  "categories": [
    {
      "name": string,
      "icon": string,
      "current_amount": number,
      "status": "ok" | "attention" | "info",
      "explanation": string | null,
      "subcategories": [
        {
          "name": string,
          "amount": number,
          "percentage": number,
          "expense_type": "ordinaria" | "extraordinaria" | "fondo_reserva",
          "provider_name": string | null,
          "provider_cuit": string | null,
          "provider_type": string | null,
          "cuit_confirmed": boolean
        }
      ]
    }
  ],
  "building_profile": {
    "country": "Argentina",
    "province": string | null,
    "city": string | null,
    "neighborhood": string | null,
    "zone": "CABA" | "GBA Norte" | "GBA Oeste" | "GBA Sur" | "Interior" | null,
    "unit_count_range": "1-10" | "11-30" | "31-50" | "51-100" | "100+" | null,
    "age_category": string | null,
    "has_amenities": boolean,
    "amenities": string[]
  },
  "administrator_name": string | null,
  "administrator_cuit": string | null,
  "administrator_cuit_confirmed": boolean,
  "administrator_contact_phone": string | null,
  "administrator_contact_email": string | null,
  "administrator_contact_address": string | null
}

═══════════════════════════════════════════════════════════════
FEW-SHOT EXAMPLES (APRENDER DEL PATRÓN):
═══════════════════════════════════════════════════════════════
Ejemplo 1 (Tabla con columnas): 
"Consorcio Calle Falsa 123   Página 1   TOTAL: $1.000.000
Unidad: 45   Coef: 0.015   Monto: $15.000"
-> JSON: {"total_amount": 1000000, "unit": "45", "unit_coefficient": 0.015, "unit_amount": 15000, ...}

Ejemplo 2 (Triple espacio como separador):
"Abono Ascensores ABC S.A.   $50.000   ordinaria
Mantenimiento Portón   $10.000   ordinaria"
-> JSON: {"categories": [{"name": "Mantenimiento", "subcategories": [{"name": "Abono Ascensores ABC S.A.", "amount": 50000}, {"name": "Mantenimiento Portón", "amount": 10000}]}]}
`;
  }

  private getAnalysisPrompt(isPDF: boolean): string {
    return "Analizá esta liquidación de expensas y extraé los datos estructurados en JSON. ADVERTENCIA: No confundas el nombre de la ADMINISTRACIÓN (ej: quien liquida) con el nombre del CONSORCIO/EDIFICIO (ej: la dirección o nombre del inmueble). Es CRÍTICO extraer el nombre correcto para el historial del usuario:";
  }
}
