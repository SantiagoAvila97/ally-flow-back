import type { Empresa } from '../types/empresa';

export const EMPRESA_FULL = 'emp-full-soluciones';
/** Tenant demo. Id estable para seeds/costos. */
export const EMPRESA_DEMO = 'emp-demo';

/**
 * Clientes (tenants) del MVP.
 * Sin archivos de logo: el OWNER los sube en Perfil y viven en DB (logo_data).
 */
export const EMPRESAS_SEED: Empresa[] = [
  {
    id: EMPRESA_FULL,
    nombre: 'Full Soluciones',
    slug: 'full-soluciones',
    nit: '900000001',
    logoDataUrl: null,
  },
  {
    id: EMPRESA_DEMO,
    nombre: 'DEMO',
    slug: 'demo',
    nit: '900000002',
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
