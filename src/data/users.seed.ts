import bcrypt from 'bcryptjs';
import type { User } from '../types/user';
import { EMPRESA_FULL, EMPRESA_NORTE } from './empresas.seed';

/**
 * Usuarios demo — 2 empresas × 3 roles (ADMIN, ASESOR, TECNICO).
 * Cada usuario solo ve datos de su empresaId.
 *
 * Full Soluciones:
 *   admin@fullsoluciones.com   / admin123
 *   asesor@fullsoluciones.com  / asesor123
 *   tecnico@fullsoluciones.com / tecnico123
 *
 * Norte Seguros:
 *   admin@norteseguros.com   / admin123
 *   asesor@norteseguros.com  / asesor123
 *   tecnico@norteseguros.com / tecnico123
 */
export const USERS_SEED: User[] = [
  {
    id: 'usr-full-admin',
    email: 'admin@fullsoluciones.com',
    nombre: 'Ana Admin Full',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_FULL,
  },
  {
    id: 'usr-full-asesor',
    email: 'asesor@fullsoluciones.com',
    nombre: 'Andrés Asesor Full',
    passwordHash: bcrypt.hashSync('asesor123', 10),
    role: 'ASESOR',
    empresaId: EMPRESA_FULL,
  },
  {
    id: 'usr-full-tecnico',
    email: 'tecnico@fullsoluciones.com',
    nombre: 'Teresa Técnico Full',
    passwordHash: bcrypt.hashSync('tecnico123', 10),
    role: 'TECNICO',
    empresaId: EMPRESA_FULL,
  },
  {
    id: 'usr-norte-admin',
    email: 'admin@norteseguros.com',
    nombre: 'Nora Admin Norte',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_NORTE,
  },
  {
    id: 'usr-norte-asesor',
    email: 'asesor@norteseguros.com',
    nombre: 'Álvaro Asesor Norte',
    passwordHash: bcrypt.hashSync('asesor123', 10),
    role: 'ASESOR',
    empresaId: EMPRESA_NORTE,
  },
  {
    id: 'usr-norte-tecnico',
    email: 'tecnico@norteseguros.com',
    nombre: 'Tomás Técnico Norte',
    passwordHash: bcrypt.hashSync('tecnico123', 10),
    role: 'TECNICO',
    empresaId: EMPRESA_NORTE,
  },
];

/** Runtime store (puede hidratarse desde Postgres). */
let usersStore: User[] = structuredClone(USERS_SEED);

export function hydrateUsers(rows: User[]): void {
  usersStore = structuredClone(rows);
}

export function findUserByEmail(email: string): User | undefined {
  return usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return usersStore.find((u) => u.id === id);
}
