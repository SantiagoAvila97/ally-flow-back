import { CIUDADES_BOGOTA_AREA } from './ciudades.seed';

/**
 * Catálogo de ciudades listo para DB (id + nombre + área).
 * Hoy se deriva del seed plano de Bogotá metro.
 */
export interface CiudadSeed {
  id: string;
  nombre: string;
  area: 'bogota_metro';
  activa: boolean;
}

function slug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const CIUDADES_CATALOGO_SEED: CiudadSeed[] = CIUDADES_BOGOTA_AREA.map((nombre) => ({
  id: `ciu-${slug(nombre)}`,
  nombre,
  area: 'bogota_metro' as const,
  activa: true,
}));
