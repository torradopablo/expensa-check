/**
 * CUIT/CUIL utility functions for Argentina
 */

/**
 * Checks if a CUIT/CUIL string belongs to a legal entity (Persona Jurídica)
 * in Argentina. Legal entities usually start with 30, 33, or 34.
 * Natural persons usually start with 20, 23, 24, or 27.
 * 
 * @param cuit The CUIT/CUIL string to check
 * @returns true if it likely belongs to a legal entity, false otherwise
 */
export function isLegalEntityCuit(cuit: string | null | undefined): boolean {
    if (!cuit) return false;

    // Remove any non-numeric characters (hyphens, dots, spaces)
    const cleanCuit = cuit.replace(/\D/g, "");

    // 30, 32, 33, 34: Sociedades, asociaciones, etc.
    // Note: 20, 23, 24, 27 are for individuals (Persona Física/CUIL)
    const legalPrefixes = ["30", "32", "33", "34"];

    return legalPrefixes.some(prefix => cleanCuit.startsWith(prefix));
}
