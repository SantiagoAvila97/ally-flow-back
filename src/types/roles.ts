/**
 * Roles de negocio del MVP (por empresa / tenant)
 * + SUPER_ADMIN de plataforma (sin tenant).
 */
export const ROLES = ['ADMIN', 'ASESOR', 'TECNICO', 'SUPER_ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export const TENANT_ROLES = ['ADMIN', 'ASESOR', 'TECNICO'] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function isSuperAdmin(role: Role): boolean {
  return role === 'SUPER_ADMIN';
}
