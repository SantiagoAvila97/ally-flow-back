import bcrypt from 'bcryptjs';
import type { User } from '../types/user';
import { EMPRESA_FULL, EMPRESA_DEMO } from './empresas.seed';

/**
 * Usuarios demo — 2 empresas × OWNER + ADMIN + ASESOR + TECNICO.
 *
 * Full Soluciones (QA):
 *   owner@fullsoluciones.com  / super123   ← OWNER (propietario)
 *   admin@fullsoluciones.com  / admin123
 *   asesor@fullsoluciones.com / asesor123
 *   tecnico@fullsoluciones.com / tecnico123
 *
 * DEMO:
 *   owner@demo.local   / super123
 *   admin@demo.local   / admin123
 *   asesor@demo.local  / asesor123
 *   tecnico@demo.local / tecnico123
 *
 * SUPER_ADMIN de plataforma: solo vía ensureSuperAdmin (env), sin empresa.
 */
export const USERS_SEED: User[] = [
  {
    id: 'usr-full-owner',
    email: 'owner@fullsoluciones.com',
    nombre: 'Sara Owner Full',
    passwordHash: bcrypt.hashSync('super123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: true,
  },
  {
    id: 'usr-full-admin',
    email: 'admin@fullsoluciones.com',
    nombre: 'Ana Admin Full',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-full-asesor',
    email: 'asesor@fullsoluciones.com',
    nombre: 'Andrés Asesor Full',
    passwordHash: bcrypt.hashSync('asesor123', 10),
    role: 'ASESOR',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-full-tecnico',
    email: 'tecnico@fullsoluciones.com',
    nombre: 'Teresa Técnico Full',
    passwordHash: bcrypt.hashSync('tecnico123', 10),
    role: 'TECNICO',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-owner',
    email: 'owner@demo.local',
    nombre: 'Sofía Owner Demo',
    passwordHash: bcrypt.hashSync('super123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: true,
  },
  {
    id: 'usr-demo-admin',
    email: 'admin@demo.local',
    nombre: 'Nora Admin Demo',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-asesor',
    email: 'asesor@demo.local',
    nombre: 'Álvaro Asesor Demo',
    passwordHash: bcrypt.hashSync('asesor123', 10),
    role: 'ASESOR',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico',
    email: 'tecnico@demo.local',
    nombre: 'Tomás Técnico Demo',
    passwordHash: bcrypt.hashSync('tecnico123', 10),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
];

/** Emails legacy (pre-rename OWNER) → se migran en ensureTenantOwners. */
export const LEGACY_OWNER_EMAILS: Record<string, string> = {
  'owner@demo.local': 'superadmin@demo.local',
  'owner@fullsoluciones.com': 'superadmin@fullsoluciones.com',
};

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

export function upsertUserInStore(user: User): void {
  const idx = usersStore.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    usersStore[idx] = { ...user };
  } else {
    usersStore.push({ ...user });
  }
}

export function listUsersByEmpresa(empresaId: string): User[] {
  return usersStore.filter((u) => u.empresaId === empresaId);
}

export function listAllUsers(): User[] {
  return [...usersStore];
}

export function removeUsersByEmpresaFromStore(empresaId: string): void {
  usersStore = usersStore.filter((u) => u.empresaId !== empresaId);
}

export function findEmpresaOwner(empresaId: string): User | undefined {
  return usersStore.find((u) => u.empresaId === empresaId && u.esOwner);
}

export function removeUserFromStore(id: string): void {
  usersStore = usersStore.filter((u) => u.id !== id);
}
