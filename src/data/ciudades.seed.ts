/**
 * Bogotá y municipios aledaños (área metropolitana / sabana).
 * Usado en formulario de alta y validación de ciudad.
 */
export const CIUDADES_BOGOTA_AREA = [
  'Bogotá',
  'Soacha',
  'Chía',
  'Cajicá',
  'Zipaquirá',
  'Facatativá',
  'Funza',
  'Madrid',
  'Mosquera',
  'Cota',
  'La Calera',
  'Sopó',
  'Tocancipá',
  'Gachancipá',
  'Sibaté',
  'Bojacá',
  'El Rosal',
  'Subachoque',
  'Tenjo',
  'Tabio',
  'Nemocón',
  'Cogua',
] as const;

export type CiudadBogotaArea = (typeof CIUDADES_BOGOTA_AREA)[number];

export function isCiudadBogotaArea(value: string): boolean {
  return (CIUDADES_BOGOTA_AREA as readonly string[]).includes(value);
}
