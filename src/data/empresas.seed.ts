import type { Empresa } from '../types/empresa';
import { loadLogoDataUrl } from '../utils/load-logo-asset';

export const EMPRESA_FULL = 'emp-full-soluciones';
/** Tenant demo. Id estable para seeds/costos. */
export const EMPRESA_DEMO = 'emp-demo';

function tryLogo(filename: string): string | null {
  try {
    return loadLogoDataUrl(filename);
  } catch {
    console.warn(`[seed] logo asset missing: ${filename}`);
    return null;
  }
}

/**
 * Clientes (tenants) del MVP.
 * Full Soluciones usa el logo oficial; DEMO usa icono Ally cuadrado.
 */
export const EMPRESAS_SEED: Empresa[] = [
  {
    id: EMPRESA_FULL,
    nombre: 'Full Soluciones',
    slug: 'full-soluciones',
    nit: '900000001',
    // Seed sin logo forzado: el OWNER lo sube (cuadro + en header/perfil).
    // Si hay asset, se usa; si no, queda null.
    logoDataUrl: tryLogo('full-soluciones.png'),
  },
  {
    id: EMPRESA_DEMO,
    nombre: 'DEMO',
    slug: 'demo',
    nit: '900000002',
    /** DEMO puede existir sin logo → UI con cuadro punteado +. */
    logoDataUrl: null,
  },
];

/** Runtime store (puede hidratarse desde Postgres). */
let empresasStore: Empresa[] = structuredClone(EMPRESAS_SEED);

export function hydrateEmpresas(rows: Empresa[]): void {
  empresasStore = structuredClone(rows);
}

export function listEmpresas(): Empresa[] {
  return [...empresasStore];
}

export function findEmpresaById(id: string): Empresa | undefined {
  return empresasStore.find((e) => e.id === id);
}

export function findEmpresaBySlug(slug: string): Empresa | undefined {
  return empresasStore.find((e) => e.slug === slug);
}

export function upsertEmpresaInStore(empresa: Empresa): void {
  const idx = empresasStore.findIndex((e) => e.id === empresa.id);
  if (idx >= 0) {
    empresasStore[idx] = { ...empresa };
  } else {
    empresasStore.push({ ...empresa });
  }
}

export function removeEmpresaFromStore(id: string): boolean {
  const before = empresasStore.length;
  empresasStore = empresasStore.filter((e) => e.id !== id);
  return empresasStore.length < before;
}

/** Tenants de referencia (DEMO / Full). */
export function isProtectedEmpresa(id: string): boolean {
  return id === EMPRESA_FULL || id === EMPRESA_DEMO;
}
