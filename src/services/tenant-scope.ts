import type { PublicUser } from '../types/user';
import { AppError } from '../middlewares/error.middleware';
import { isSuperAdmin } from '../types/roles';

/** Exige usuario de tenant con empresaId (no SUPER_ADMIN). */
export function requireTenantEmpresaId(user: PublicUser): string {
  if (isSuperAdmin(user.role) || !user.empresaId) {
    throw new AppError(403, 'Esta acción es solo para usuarios de una empresa');
  }
  return user.empresaId;
}
