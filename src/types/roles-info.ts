import type { CasoAction } from './caso-permissions';
import { CASO_ACTION_ROLES } from './caso-permissions';
import type { Permission } from './permissions';
import { permissionsForRole } from './permissions';
import type { Role } from './roles';
import { TENANT_ROLES } from './roles';

const PERMISSION_LABELS: Record<string, string> = {
  'suite:empresas': 'Gestionar empresas (Suite)',
  'usuarios:gestionar': 'Gestionar usuarios',
  'admin:tarifas': 'Administrar tarifas',
  'admin:catalogos': 'Administrar clientes / catálogos',
  'balance:ver': 'Ver balance',
  'tenant:acceso': 'Acceso a la empresa',
  'casos:crear': 'Crear casos',
  'casos:asignar': 'Asignar técnico',
  'casos:iniciar': 'Iniciar gestión',
  'casos:fotos': 'Subir fotos',
  'casos:documentar': 'Documentar caso',
  'casos:completar': 'Completar caso',
  'casos:lineas_cobro': 'Armar líneas de cobro',
  'casos:enviar_documento': 'Enviar documento de cobro',
  'casos:confirmar_asegurado': 'Confirmar asegurado',
  'casos:cobrar': 'Marcar cobrado',
  'casos:garantia': 'Gestión de garantía',
};

/** Caps legibles para la UI de “permisos por rol”. */
export interface RoleCapability {
  key: string;
  label: string;
}

export interface RoleInfoRow {
  role: Role;
  label: string;
  capabilities: RoleCapability[];
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'SUPER ADMIN (plataforma)',
  ADMIN: 'Administrador',
  ASESOR: 'Asesor',
  TECNICO: 'Técnico',
};

function labelFor(perm: Permission): string {
  return PERMISSION_LABELS[perm] ?? perm;
}

/** Matriz para ADMIN / ASESOR / TECNICO (+ info SUPER si se pide). */
export function buildRolesInfo(includeSuper = false): RoleInfoRow[] {
  const roles: Role[] = includeSuper
    ? ['SUPER_ADMIN', ...TENANT_ROLES]
    : [...TENANT_ROLES];

  // Asegurar que todas las acciones de caso tengan label (defensivo)
  for (const action of Object.keys(CASO_ACTION_ROLES) as CasoAction[]) {
    const key = `casos:${action}`;
    if (!PERMISSION_LABELS[key]) {
      PERMISSION_LABELS[key] = action;
    }
  }

  return roles.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    capabilities: permissionsForRole(role).map((key) => ({
      key,
      label: labelFor(key),
    })),
  }));
}
