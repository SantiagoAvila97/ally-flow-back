import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/user';
import { isRole, isSuperAdmin } from '../types/roles';

/**
 * Middleware de autenticación JWT (HS256, iss/aud, exp).
 * SUPER_ADMIN puede no tener empresaId.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticación requerido' });
    return;
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
      clockTolerance: 30,
    }) as JwtPayload;

    if (!decoded.sub || !decoded.email || !isRole(decoded.role)) {
      res.status(401).json({ message: 'Token con claims inválidos' });
      return;
    }

    if (!isSuperAdmin(decoded.role) && !decoded.empresaId) {
      res.status(401).json({ message: 'Token con claims inválidos' });
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      nombre: decoded.nombre,
      role: decoded.role,
      empresaId: decoded.empresaId ?? null,
      empresaNombre: decoded.empresaNombre ?? null,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Sesión expirada. Vuelve a iniciar sesión.' });
      return;
    }
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
