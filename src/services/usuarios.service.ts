import bcrypt from 'bcryptjs';
import { findEmpresaById } from '../data/empresas.seed';
import {
  findUserByEmail,
  findUserById,
  listUsersByEmpresa,
  upsertUserInStore,
} from '../data/users.seed';
import { persistUser } from '../db/persist';
import { AppError } from '../middlewares/error.middleware';
import { buildRolesInfo } from '../types/roles-info';
import type { Role } from '../types/roles';
import { isSuperAdmin } from '../types/roles';
import type { PublicUser, User } from '../types/user';
import { titleCaseWords } from '../utils/text';

export interface ManagedUserDto {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  activo: boolean;
  /** Super Admin / propietario de la empresa. */
  esOwner: boolean;
}

export interface CreateManagedUserInput {
  nombre: string;
  email: string;
  password: string;
  role: Role;
  empresaId?: string | null;
}

export interface UpdateManagedUserInput {
  nombre?: string;
  email?: string;
  role?: Role;
  activo?: boolean;
}

function toDto(u: User): ManagedUserDto {
  return {
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    role: u.role,
    empresaId: u.empresaId,
    activo: u.activo !== false,
    esOwner: Boolean(u.esOwner),
  };
}

function actorIsEmpresaOwner(actor: PublicUser): boolean {
  if (isSuperAdmin(actor.role)) return false;
  if (actor.esOwner) return true;
  // Tokens viejos sin claim: mirar store
  return Boolean(findUserById(actor.id)?.esOwner);
}

function assertCanManageTarget(actor: PublicUser, target: User): void {
  if (isSuperAdmin(target.role)) {
    throw new AppError(403, 'No se pueden gestionar usuarios SUPER_ADMIN');
  }
  if (isSuperAdmin(actor.role)) {
    throw new AppError(
      403,
      'SUPER ADMIN solo consulta usuarios. Crear/editar lo hacen OWNER y Administradores',
    );
  }
  if (actor.role === 'ADMIN') {
    if (target.empresaId !== actor.empresaId) {
      throw new AppError(403, 'Usuario de otra empresa');
    }
    if (actorIsEmpresaOwner(actor)) {
      // OWNER: gestiona ADMIN (no owners), ASESOR, TECNICO
      if (target.esOwner) {
        throw new AppError(403, 'No puedes gestionar al OWNER de la empresa');
      }
      if (target.role !== 'ADMIN' && target.role !== 'ASESOR' && target.role !== 'TECNICO') {
        throw new AppError(403, 'Rol no gestionable');
      }
      return;
    }
    if (target.role !== 'ASESOR' && target.role !== 'TECNICO') {
      throw new AppError(403, 'Solo puedes gestionar asesores y técnicos');
    }
    return;
  }
  throw new AppError(403, 'Sin permiso para gestionar usuarios');
}

function resolveCreateRoleAndEmpresa(
  actor: PublicUser,
  input: CreateManagedUserInput,
): { role: Role; empresaId: string } {
  if (isSuperAdmin(actor.role)) {
    throw new AppError(
      403,
      'SUPER ADMIN no crea usuarios. Crea la empresa (OWNER) en Suite; el OWNER gestiona el equipo',
    );
  }

  if (actor.role === 'ADMIN') {
    if (!actor.empresaId) {
      throw new AppError(400, 'Empresa del admin no definida');
    }
    if (actorIsEmpresaOwner(actor)) {
      if (input.role !== 'ADMIN' && input.role !== 'ASESOR' && input.role !== 'TECNICO') {
        throw new AppError(400, 'Rol inválido');
      }
      return { role: input.role, empresaId: actor.empresaId };
    }
    if (input.role !== 'ASESOR' && input.role !== 'TECNICO') {
      throw new AppError(400, 'Solo puedes crear asesores o técnicos');
    }
    return { role: input.role, empresaId: actor.empresaId };
  }

  throw new AppError(403, 'Sin permiso para crear usuarios');
}

export class UsuariosService {
  rolesInfo() {
    return buildRolesInfo(true);
  }

  list(actor: PublicUser, empresaIdQuery?: string): ManagedUserDto[] {
    let empresaId: string | null = null;

    if (isSuperAdmin(actor.role)) {
      empresaId = (empresaIdQuery ?? '').trim() || null;
      if (!empresaId) {
        throw new AppError(400, 'empresaId es requerido');
      }
      if (!findEmpresaById(empresaId)) {
        throw new AppError(404, 'Empresa no encontrada');
      }
    } else if (actor.role === 'ADMIN') {
      empresaId = actor.empresaId;
      if (!empresaId) throw new AppError(400, 'Empresa no definida');
    } else {
      throw new AppError(403, 'Sin permiso');
    }

    return listUsersByEmpresa(empresaId)
      .filter((u) => !isSuperAdmin(u.role))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map(toDto);
  }

  create(
    actor: PublicUser,
    input: CreateManagedUserInput,
  ): { user: ManagedUserDto; password: string } {
    const { role, empresaId } = resolveCreateRoleAndEmpresa(actor, input);
    const nombre = titleCaseWords(input.nombre ?? '');
    const email = input.email?.trim().toLowerCase() ?? '';
    const password = input.password ?? '';

    if (!nombre || nombre.length < 2) {
      throw new AppError(400, 'Nombre requerido');
    }
    if (!email || !email.includes('@')) {
      throw new AppError(400, 'Email inválido');
    }
    if (password.length < 8) {
      throw new AppError(400, 'La contraseña debe tener al menos 8 caracteres');
    }
    if (findUserByEmail(email)) {
      throw new AppError(409, 'Ya existe un usuario con ese email');
    }

    const user: User = {
      id: `usr-${role.toLowerCase()}-${Date.now().toString(36)}`,
      email,
      nombre,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
      empresaId,
      activo: true,
      esOwner: false,
    };

    upsertUserInStore(user);
    persistUser(user);

    return { user: toDto(user), password };
  }

  update(actor: PublicUser, id: string, input: UpdateManagedUserInput): ManagedUserDto {
    const target = findUserById(id);
    if (!target) throw new AppError(404, 'Usuario no encontrado');
    if (target.id === actor.id) {
      throw new AppError(400, 'No puedes editar tu propio usuario desde aquí');
    }
    assertCanManageTarget(actor, target);

    // Al editar: OWNER / ADMIN (no SUPER_ADMIN plataforma)
    let nextRole = target.role;
    if (input.role !== undefined && input.role !== target.role) {
      if (isSuperAdmin(actor.role)) {
        throw new AppError(403, 'SUPER ADMIN no edita usuarios');
      } else if (actor.role === 'ADMIN') {
        if (actorIsEmpresaOwner(actor)) {
          if (input.role !== 'ADMIN' && input.role !== 'ASESOR' && input.role !== 'TECNICO') {
            throw new AppError(400, 'Rol inválido');
          }
          if (target.esOwner && input.role !== 'ADMIN') {
            throw new AppError(400, 'El OWNER de la empresa debe permanecer como ADMIN');
          }
          nextRole = input.role;
        } else if (input.role !== 'ASESOR' && input.role !== 'TECNICO') {
          throw new AppError(400, 'Solo puedes asignar ASESOR o TECNICO');
        } else {
          nextRole = input.role;
        }
      }
    }

    let nextEmail = target.email;
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      if (!email.includes('@')) throw new AppError(400, 'Email inválido');
      const other = findUserByEmail(email);
      if (other && other.id !== target.id) {
        throw new AppError(409, 'Ya existe un usuario con ese email');
      }
      nextEmail = email;
    }

    let nextNombre = target.nombre;
    if (input.nombre !== undefined) {
      nextNombre = titleCaseWords(input.nombre);
      if (nextNombre.length < 2) throw new AppError(400, 'Nombre inválido');
    }

    let nextActivo = target.activo !== false;
    if (input.activo !== undefined) {
      if (target.esOwner && input.activo === false) {
        throw new AppError(400, 'No se puede desactivar al OWNER de la empresa');
      }
      nextActivo = Boolean(input.activo);
    }

    const next: User = {
      ...target,
      nombre: nextNombre,
      email: nextEmail,
      role: nextRole,
      activo: nextActivo,
      esOwner: Boolean(target.esOwner),
    };

    upsertUserInStore(next);
    persistUser(next);
    return toDto(next);
  }

  resetPassword(
    actor: PublicUser,
    id: string,
    newPassword: string,
  ): { password: string } {
    const target = findUserById(id);
    if (!target) throw new AppError(404, 'Usuario no encontrado');
    if (target.id === actor.id) {
      throw new AppError(400, 'Usa Perfil para cambiar tu propia contraseña');
    }
    assertCanManageTarget(actor, target);

    if (!newPassword || newPassword.length < 8) {
      throw new AppError(400, 'La contraseña debe tener al menos 8 caracteres');
    }

    const next: User = {
      ...target,
      passwordHash: bcrypt.hashSync(newPassword, 10),
      activo: target.activo !== false,
      esOwner: Boolean(target.esOwner),
    };
    upsertUserInStore(next);
    persistUser(next);
    return { password: newPassword };
  }

  canEdit(actor: PublicUser, target: ManagedUserDto): boolean {
    if (target.id === actor.id) return false;
    // SUPER_ADMIN plataforma: solo lectura
    if (isSuperAdmin(actor.role)) return false;
    if (actor.role === 'ADMIN') {
      if (target.empresaId !== actor.empresaId) return false;
      if (actorIsEmpresaOwner(actor)) {
        return !target.esOwner;
      }
      return target.role === 'ASESOR' || target.role === 'TECNICO';
    }
    return false;
  }
}
export const usuariosService = new UsuariosService();
