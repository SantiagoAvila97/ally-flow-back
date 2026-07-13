import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/user';
import { isRole } from '../types/roles';

/**
 * Middleware de autenticación JWT.
 *
 * Espera header: Authorization: Bearer <token>
 * Si el token es válido, adjunta req.user (incluye empresaId) y continúa.
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
    }) as JwtPayload;

    if (
      !decoded.sub ||
      !decoded.email ||
      !decoded.empresaId ||
      !isRole(decoded.role)
    ) {
      res.status(401).json({ message: 'Token con claims inválidos' });
      return;
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      nombre: decoded.nombre,
      role: decoded.role,
      empresaId: decoded.empresaId,
      empresaNombre: decoded.empresaNombre,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}
