import { findEmpresaById } from '../data/empresas.seed';
import { findUserByEmail, findUserById, upsertUserInStore } from '../data/users.seed';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import type { JwtPayload, PublicUser } from '../types/user';
import { permissionsForRole } from '../types/permissions';
import { isSuperAdmin } from '../types/roles';
import { persistUser } from '../db/persist';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = findUserByEmail(normalizedEmail);
    if (!user) {
      throw new AppError(401, 'El usuario no existe');
    }

    if (user.activo === false) {
      throw new AppError(401, 'Usuario desactivado');
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
      esOwner: Boolean(user.esOwner),
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
      esOwner: Boolean(user.esOwner),
      exp: decoded?.exp,
    };

    return { token, user: publicUser };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = findUserById(userId);
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    if (!newPassword || newPassword.length < 8) {
      throw new AppError(400, 'La nueva contraseña debe tener al menos 8 caracteres');
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'Contraseña actual incorrecta');
    }

    const next = {
      ...user,
      passwordHash: bcrypt.hashSync(newPassword, 10),
    };
    upsertUserInStore(next);
    persistUser(next);
  }
}

export const authService = new AuthService();
