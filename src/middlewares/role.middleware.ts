import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../types/roles';
import { isSuperAdmin } from '../types/roles';

/**
 * Middleware de autorización basado en roles (RBAC).
 * Debe ejecutarse DESPUÉS de `authenticate`.
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Acceso denegado. Se requiere uno de: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Rutas de tenant (casos, costos, balance…): exige empresa en el JWT.
 * SUPER_ADMIN no opera como tenant — solo Suite (/empresas).
 */
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'No autenticado' });
    return;
  }
  if (isSuperAdmin(req.user.role) || !req.user.empresaId) {
    res.status(403).json({
      message: 'Acceso de empresa requerido. El SUPER_ADMIN solo usa la Suite.',
    });
    return;
  }
  next();
}
