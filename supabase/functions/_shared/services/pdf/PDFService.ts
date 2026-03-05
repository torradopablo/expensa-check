import { resolvePDFJS } from "https://esm.sh/pdfjs-serverless@0.4.2";

export class PDFService {
    async extractText(arrayBuffer: ArrayBuffer): Promise<string> {
        try {
            const data = new Uint8Array(arrayBuffer);
            const { getDocument } = await resolvePDFJS();
            
            // Agregamos verbosity: 0 para evitar logs innecesarios en Supabase
            const doc = await getDocument({ 
                data, 
                useSystemFonts: true,
                verbosity: 0 
            }).promise;

            const allText: string[] = [];
            
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const textContent = await page.getTextContent();
                const items = textContent.items as any[];

                if (items.length === 0) {
                    allText.push(`[Página ${i}: No se detectó texto. ¿Es un escaneo o imagen?]`);
                    continue;
                }

                // Agrupar por coordenada Y con un umbral dinámico (2pt suele ser ideal para tablas)
                const lineBuckets = new Map<number, any[]>();
                for (const item of items) {
                    if (!item.str || item.str.trim() === "") continue;
                    
                    // Usamos un umbral de 2 para mayor precisión en tablas apretadas
                    const y = Math.round(item.transform[5] / 2) * 2; 
                    if (!lineBuckets.has(y)) lineBuckets.set(y, []);
                    lineBuckets.get(y)!.push(item);
                }

                const sortedY = Array.from(lineBuckets.keys()).sort((a, b) => b - a);
                let pageContent = "";

                for (const y of sortedY) {
                    const lineItems = lineBuckets.get(y)!.sort((a, b) => a.transform[4] - b.transform[4]);
                    let lineStr = "";
                    let lastX = 0;
                    let lastWidth = 0;

                    for (const item of lineItems) {
                        const x = item.transform[4];
                        const text = item.str.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        
                        // Lógica de espaciado mejorada:
                        // Si la distancia entre el final del anterior y el inicio del actual
                        // es mayor a la mitad del ancho del carácter actual, insertamos espacio.
                        if (lastX !== 0) {
                            const gap = x - (lastX + lastWidth);
                            if (gap > 2) { // 2 puntos de espacio mínimo para considerar separación
                                // Intentamos simular columnas basándonos en el gap
                                const spaces = Math.min(Math.max(1, Math.floor(gap / 4)), 15);
                                lineStr += " ".repeat(spaces);
                            }
                        } else {
                            // Indentación inicial si la línea no empieza en el margen izquierdo (x > 50)
                            if (x > 50) {
                                lineStr += " ".repeat(Math.floor(x / 8));
                            }
                        }

                        lineStr += text;
                        lastX = x;
                        lastWidth = item.width || (text.length * 5); // Fallback si no hay width
                    }
                    pageContent += lineStr.trimEnd() + "\n";
                }
                allText.push(pageContent);
            }

            const result = allText.join("\n\n--- PÁGINA ---\n\n");
            
            if (result.trim().length === 0) {
                throw new Error("El PDF parece estar vacío o ser una imagen sin capa de texto.");
            }

            return result;
        } catch (error) {
            console.error("Error en PDFService:", error);
            throw error;
        }
    }
}