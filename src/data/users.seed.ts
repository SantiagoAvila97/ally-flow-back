import bcrypt from 'bcryptjs';
import type { User } from '../types/user';
import { EMPRESA_FULL, EMPRESA_DEMO } from './empresas.seed';

/**
 * Usuarios demo — 2 empresas × 3 roles (ADMIN, ASESOR, TECNICO).
 * Cada usuario solo ve datos de su empresaId.
 *
 * Full Soluciones (QA):
 *   admin@fullsoluciones.com   / admin123
 *   asesor@fullsoluciones.com  / asesor123
 *   tecnico@fullsoluciones.com / tecnico123
 *
 * DEMO:
 *   admin@demo.local   / admin123
 *   asesor@demo.local  / asesor123
 *   tecnico@demo.local / tecnico123
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
    email: 'admin@demo.local',
    nombre: 'Nora Admin Demo',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_DEMO,
  },
  {
    id: 'usr-norte-asesor',
    email: 'asesor@demo.local',
    nombre: 'Álvaro Asesor Demo',
    passwordHash: bcrypt.hashSync('asesor123', 10),
    role: 'ASESOR',
    empresaId: EMPRESA_DEMO,
  },
  {
    id: 'usr-norte-tecnico',
    email: 'tecnico@demo.local',
    nombre: 'Tomás Técnico Demo',
    passwordHash: bcrypt.hashSync('tecnico123', 10),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
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
