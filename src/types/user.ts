import type { Role } from './roles';

export interface User {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  role: Role;
  empresaId: string;
}

/** Payload seguro que viaja en el JWT y se expone al cliente (sin password). */
export interface PublicUser {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string;
  empresaNombre: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  nombre: string;
  role: Role;
  empresaId: string;
  empresaNombre: string;
  iat?: number;
  exp?: number;
}
