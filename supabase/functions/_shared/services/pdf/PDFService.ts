import { resolvePDFJS } from "https://esm.sh/pdfjs-serverless@0.4.2";

export class PDFService {
    /**
     * Extracts text from a PDF file
     * @param arrayBuffer The PDF file as an ArrayBuffer
     * @returns The extracted text
     */
    async extractText(arrayBuffer: ArrayBuffer): Promise<string> {
        try {
            const data = new Uint8Array(arrayBuffer);
            const { getDocument } = await resolvePDFJS();
            const doc = await getDocument({ data, useSystemFonts: true }).promise;

            const allText: string[] = [];
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const textContent = await page.getTextContent();
                // transform[5] is the Y coordinate (from bottom), transform[4] is the X.
                const items = textContent.items as any[];

                // Group items by their Y coordinate (vertical position) with a small threshold
                const lineBuckets = new Map<number, any[]>();
                for (const item of items) {
                    if (!item.str || item.str.trim() === "") continue; // Skip empty items

                    const y = Math.round(item.transform[5] / 3) * 3; // 3pt tolerance for lines
                    if (!lineBuckets.has(y)) lineBuckets.set(y, []);
                    lineBuckets.get(y)!.push(item);
                }

                // Sort Y buckets top to bottom
                const sortedY = Array.from(lineBuckets.keys()).sort((a, b) => b - a);

                let pageContent = "";
                const CHAR_WIDTH = 4.5; // Aproximación de ancho de carácter para simular grilla (595pts / 4.5 = ~132 cols)

                for (const y of sortedY) {
                    const lineItems = lineBuckets.get(y)!.sort((a, b) => a.transform[4] - b.transform[4]);

                    let lineStr = "";
                    let lastEndChar = 0;

                    for (const item of lineItems) {
                        const x = item.transform[4];
                        const targetCharPos = Math.max(0, Math.floor(x / CHAR_WIDTH));

                        const spacesToInsert = targetCharPos - lastEndChar;

                        if (spacesToInsert > 0) {
                            // Insertar espacios para llegar a la columna correcta
                            lineStr += " ".repeat(spacesToInsert);
                        } else if (spacesToInsert < 0 && lineStr.length > 0 && !lineStr.endsWith(" ")) {
                            // Si se superpone y no hay espacio previo, asegurar al menos 1 espacio para separar palabras
                            lineStr += " ";
                        }

                        // Reemplazar caracteres invisibles
                        const text = item.str.replace(/[\u200B-\u200D\uFEFF]/g, '');
                        lineStr += text;
                        lastEndChar = lineStr.length;
                    }

                    pageContent += lineStr.trimEnd() + "\n";
                }

                allText.push(pageContent);
            }

            return allText.join("\n\n--- PÁGINA ---\n\n");
        } catch (error) {
            console.error("Error extracting text from PDF:", error);
            throw new Error(`Error al extraer texto del PDF: ${error instanceof Error ? error.message : "Error desconocido"}`);
        }
    }
}
