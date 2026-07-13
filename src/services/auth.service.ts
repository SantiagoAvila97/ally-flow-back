import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { findEmpresaById } from '../data/empresas.seed';
import { findUserByEmail } from '../data/users.seed';
import { AppError } from '../middlewares/error.middleware';
import type { JwtPayload, PublicUser } from '../types/user';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  /**
   * Valida credenciales y emite JWT con claims de rol + tenant (empresa).
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

    const empresa = findEmpresaById(user.empresaId);
    if (!empresa) {
      throw new AppError(500, 'Empresa del usuario no encontrada');
    }

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      empresaId: empresa.id,
      empresaNombre: empresa.nombre,
    };

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      empresaId: empresa.id,
      empresaNombre: empresa.nombre,
    };

    const token = jwt.sign(payload, env.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return { token, user: publicUser };
  }
}

export const authService = new AuthService();
