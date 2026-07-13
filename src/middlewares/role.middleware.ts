import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../types/roles';

/**
 * ============================================================================
 * Middleware de autorización basado en roles (RBAC)
 * ============================================================================
 *
 * Uso:
 *   router.get('/admin-only', authenticate, requireRoles('ADMIN'), handler);
 *   router.post('/fotos', authenticate, requireRoles('TECNICO'), handler);
 *   router.patch('/estado', authenticate, requireRoles('ADMIN', 'TECNICO'), handler);
 *
 * Flujo:
 *   1. Debe ejecutarse DESPUÉS de `authenticate` (necesita req.user).
 *   2. Compara req.user.role contra la lista blanca de roles permitidos.
 *   3. Si el rol no está permitido → 403 Forbidden.
 *   4. Si no hay usuario autenticado → 401 (defensa en profundidad).
 *
 * Escalabilidad:
 *   - Para permisos más finos (por recurso), combinar con checks en el service layer.
 *   - Para jerarquías (ADMIN implica todo), extender `hasPermission(role, action)`.
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Defensa: authenticate debió poblar req.user
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        message: `Acceso denegado. Se requiere uno de: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
