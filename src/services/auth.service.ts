import { findEmpresaById } from '../data/empresas.seed';
import { findUserByEmail } from '../data/users.seed';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import type { JwtPayload, PublicUser } from '../types/user';
import { permissionsForRole } from '../types/permissions';
import { isSuperAdmin } from '../types/roles';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  /**
   * Valida credenciales y emite JWT con claims de rol + permisos + tenant.
   * SUPER_ADMIN: sin empresa.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = findUserByEmail(normalizedEmail);
    if (!user) {
      throw new AppError(401, 'El usuario no existe');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Contraseña incorrecta');
    }

    let empresaId: string | null = null;
    let empresaNombre: string | null = null;

    if (isSuperAdmin(user.role)) {
      empresaId = null;
      empresaNombre = null;
    } else {
      if (!user.empresaId) {
        throw new AppError(500, 'Usuario de tenant sin empresa asignada');
      }
      const empresa = findEmpresaById(user.empresaId);
      if (!empresa) {
        throw new AppError(500, 'Empresa del usuario no encontrada');
      }
      empresaId = empresa.id;
      empresaNombre = empresa.nombre;
    }

    const permissions = permissionsForRole(user.role);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      empresaId,
      empresaNombre,
      permissions,
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });

    const decoded = jwt.decode(token) as JwtPayload | null;

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      empresaId,
      empresaNombre,
      permissions,
      exp: decoded?.exp,
    };

    return { token, user: publicUser };
  }
}

export const authService = new AuthService();
