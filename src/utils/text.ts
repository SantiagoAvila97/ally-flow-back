/** Artículos / conjunciones que van en minúscula salvo al inicio. */
const LOWER_MID = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'a', 'en', 'el']);

/**
 * Title Case por palabras (ES simple).
 * "cemento" → "Cemento", "prueba nuevo cliente" → "Prueba Nuevo Cliente"
 * No inventa espacios: "pruebanuevo" → "Pruebanuevo"
 */
export function titleCaseWords(input: string): string {
  const collapsed = input.trim().replace(/\s+/g, ' ');
  if (!collapsed) return '';

  return collapsed
    .split(' ')
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('es');
      if (index > 0 && LOWER_MID.has(lower)) return lower;
      if (!lower) return lower;
      return lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1);
    })
    .join(' ');
}
