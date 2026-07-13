import type { Role } from './roles';
import type { Permission } from './permissions';

export interface User {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  role: Role;
  /** Null solo para SUPER_ADMIN (plataforma). */
  empresaId: string | null;
  /** Si false, no puede iniciar sesión. */
  activo: boolean;
  /**
   * OWNER de la empresa (propietario).
   * Distinto del SUPER_ADMIN de plataforma. Rol sigue siendo ADMIN + esOwner.
   */
  esOwner: boolean;
}

/** Payload seguro que viaja en el JWT y se expone al cliente (sin password). */
export interface PublicUser {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
  permissions: Permission[];
  /** OWNER de la empresa (rol ADMIN + esOwner). */
  esOwner: boolean;
  /** Unix seconds — fin de sesión (misma exp del JWT). */
  exp?: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
  permissions: Permission[];
  esOwner?: boolean;
  iat?: number;
  exp?: number;
}
