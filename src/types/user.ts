import type { Role } from './roles';

export interface User {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  role: Role;
  /** Null solo para SUPER_ADMIN (plataforma). */
  empresaId: string | null;
}

/** Payload seguro que viaja en el JWT y se expone al cliente (sin password). */
export interface PublicUser {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string | null;
  empresaNombre: string | null;
  iat?: number;
  exp?: number;
}
