/**
 * Extracts the class name from Java source code.
 * @param sourceCode - The Java source code as a string.
 * @returns The class name, or null if no class name could be found.
 */
export function extractClassName(sourceCode: string): string | null {
    const classNameRegex = /public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/;
    const match = sourceCode.match(classNameRegex);
    return match ? match[1] : null;
}
