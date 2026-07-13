import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types/user';
import { permissionsMatchRole } from '../types/permissions';
import { isRole, isSuperAdmin } from '../types/roles';
import { AUTH_COOKIE } from '../utils/auth-cookie';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }
  const fromCookie = req.cookies?.[AUTH_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie.trim()) {
    return fromCookie.trim();
  }
  return null;
}

/**
 * Autenticación JWT (HS256, iss/aud, exp, permissions).
 * Cookie httpOnly o Authorization: Bearer (tools / legacy).
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ message: 'Token de autenticación requerido' });
    return;
  }

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

    if (!permissionsMatchRole(decoded.role, decoded.permissions)) {
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
      permissions: decoded.permissions,
      exp: decoded.exp,
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
