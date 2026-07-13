import type { Empresa } from '../types/empresa';

export const EMPRESA_FULL = 'emp-full-soluciones';
export const EMPRESA_NORTE = 'emp-norte-seguros';

/**
 * Clientes (tenants) del MVP.
 * Onboarding de un 5º cliente = nuevo registro aquí + usuarios de esa empresa.
 */
export const EMPRESAS_SEED: Empresa[] = [
  {
    id: EMPRESA_FULL,
    nombre: 'Full Soluciones',
    slug: 'full-soluciones',
  },
  {
    id: EMPRESA_NORTE,
    nombre: 'Norte Seguros',
    slug: 'norte-seguros',
  },
];

export function findEmpresaById(id: string): Empresa | undefined {
  return EMPRESAS_SEED.find((e) => e.id === id);
}
