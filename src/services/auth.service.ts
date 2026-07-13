import { findEmpresaById } from '../data/empresas.seed';
import { findUserByEmail } from '../data/users.seed';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import type { JwtPayload, PublicUser } from '../types/user';
import { isSuperAdmin } from '../types/roles';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  /**
   * Valida credenciales y emite JWT con claims de rol + tenant (empresa).
   * SUPER_ADMIN: sin empresa.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = findUserByEmail(email);
    if (!user) {
      throw new AppError(401, 'Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Credenciales inválidas');
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

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      empresaId,
      empresaNombre,
    };

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      empresaId,
      empresaNombre,
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });

    return { token, user: publicUser };
  }
}

export const authService = new AuthService();
