import { EMPRESAS_SEED, findEmpresaById, upsertEmpresaInStore } from '../data/empresas.seed';
import { upsertEmpresa } from './persist';
import { hasDatabase } from './pool';

/**
 * Solo rellena logo de Full Soluciones si falta (asset de arranque).
 * DEMO queda sin logo a propósito → cuadro + en UI para que el OWNER lo suba.
 */
export async function ensureEmpresaLogos(): Promise<void> {
  for (const seed of EMPRESAS_SEED) {
    if (seed.slug === 'demo') continue;
    if (!seed.logoDataUrl) continue;
    const current = findEmpresaById(seed.id);
    if (!current) continue;
    if (current.logoDataUrl) continue;
    const next = { ...current, logoDataUrl: seed.logoDataUrl };
    upsertEmpresaInStore(next);
    if (hasDatabase()) await upsertEmpresa(next);
    console.log(`[db] logo set for empresa ${seed.nombre}`);
  }
}
