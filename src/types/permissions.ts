import type { Role } from './roles';
import { CASO_ACTION_ROLES, type CasoAction } from './caso-permissions';

/** Permisos firmados en el JWT (derivados del rol). */
export type Permission =
  | `casos:${CasoAction}`
  | 'suite:empresas'
  | 'admin:tarifas'
  | 'admin:catalogos'
  | 'balance:ver'
  | 'tenant:acceso';

const EXTRA_BY_ROLE: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: ['suite:empresas'],
  ADMIN: ['tenant:acceso', 'admin:tarifas', 'admin:catalogos', 'balance:ver'],
  ASESOR: ['tenant:acceso', 'balance:ver'],
  TECNICO: ['tenant:acceso'],
};

function casoPermissionsForRole(role: Role): Permission[] {
  const out: Permission[] = [];
  for (const [action, roles] of Object.entries(CASO_ACTION_ROLES) as [
    CasoAction,
    readonly Role[],
  ][]) {
    if (roles.includes(role)) {
      out.push(`casos:${action}`);
    }
  }
  return out;
}

/** Lista estable (ordenada) de permisos para un rol. */
export function permissionsForRole(role: Role): Permission[] {
  const set = new Set<Permission>([
    ...EXTRA_BY_ROLE[role],
    ...casoPermissionsForRole(role),
  ]);
  return [...set].sort();
}

/** True si el claim del token coincide exactamente con el mapa del rol. */
export function permissionsMatchRole(
  role: Role,
  permissions: unknown,
): boolean {
  if (!Array.isArray(permissions)) return false;
  const expected = permissionsForRole(role);
  if (permissions.length !== expected.length) return false;
  const got = [...permissions].map(String).sort();
  return expected.every((p, i) => got[i] === p);
}
