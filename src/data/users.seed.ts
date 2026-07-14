import bcrypt from 'bcryptjs';
import type { User } from '../types/user';
import { EMPRESA_FULL, EMPRESA_DEMO } from './empresas.seed';

/**
 * Usuarios demo — Full (1 de cada rol) + DEMO poblado (4 asesores, 7 técnicos).
 *
 * Full Soluciones (QA):
 *   owner@fullsoluciones.com  / super123
 *   admin@fullsoluciones.com  / admin123
 *   asesor@fullsoluciones.com / asesor123
 *   tecnico@fullsoluciones.com / tecnico123
 *
 * DEMO:
 *   owner@demo.local  / super123
 *   admin@demo.local  / admin123
 *   asesor@demo.local … asesor4@demo.local / asesor123
 *   tecnico@demo.local … tecnico7@demo.local / tecnico123
 *
 * SUPER_ADMIN de plataforma: solo vía ensureSuperAdmin (env), sin empresa.
 */
function hash(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export const DEMO_ASESOR_IDS = [
  'usr-demo-asesor',
  'usr-demo-asesor-2',
  'usr-demo-asesor-3',
  'usr-demo-asesor-4',
] as const;

export const DEMO_TECNICO_IDS = [
  'usr-demo-tecnico',
  'usr-demo-tecnico-2',
  'usr-demo-tecnico-3',
  'usr-demo-tecnico-4',
  'usr-demo-tecnico-5',
  'usr-demo-tecnico-6',
  'usr-demo-tecnico-7',
] as const;

export const USERS_SEED: User[] = [
  {
    id: 'usr-full-owner',
    email: 'owner@fullsoluciones.com',
    nombre: 'Sara Owner Full',
    passwordHash: hash('super123'),
    role: 'ADMIN',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: true,
  },
  {
    id: 'usr-full-admin',
    email: 'admin@fullsoluciones.com',
    nombre: 'Ana Admin Full',
    passwordHash: hash('admin123'),
    role: 'ADMIN',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-full-asesor',
    email: 'asesor@fullsoluciones.com',
    nombre: 'Andrés Asesor Full',
    passwordHash: hash('asesor123'),
    role: 'ASESOR',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-full-tecnico',
    email: 'tecnico@fullsoluciones.com',
    nombre: 'Teresa Técnico Full',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_FULL,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-owner',
    email: 'owner@demo.local',
    nombre: 'Sofía Owner Demo',
    passwordHash: hash('super123'),
    role: 'ADMIN',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: true,
  },
  {
    id: 'usr-demo-admin',
    email: 'admin@demo.local',
    nombre: 'Nora Admin Demo',
    passwordHash: hash('admin123'),
    role: 'ADMIN',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-asesor',
    email: 'asesor@demo.local',
    nombre: 'Álvaro Asesor Demo',
    passwordHash: hash('asesor123'),
    role: 'ASESOR',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-asesor-2',
    email: 'asesor2@demo.local',
    nombre: 'Beatriz Asesora Demo',
    passwordHash: hash('asesor123'),
    role: 'ASESOR',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-asesor-3',
    email: 'asesor3@demo.local',
    nombre: 'Carlos Asesor Demo',
    passwordHash: hash('asesor123'),
    role: 'ASESOR',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-asesor-4',
    email: 'asesor4@demo.local',
    nombre: 'Diana Asesora Demo',
    passwordHash: hash('asesor123'),
    role: 'ASESOR',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico',
    email: 'tecnico@demo.local',
    nombre: 'Tomás Técnico Demo',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico-2',
    email: 'tecnico2@demo.local',
    nombre: 'Luis Técnico Demo',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico-3',
    email: 'tecnico3@demo.local',
    nombre: 'María Técnica Demo',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico-4',
    email: 'tecnico4@demo.local',
    nombre: 'Pedro Técnico Demo',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico-5',
    email: 'tecnico5@demo.local',
    nombre: 'Elena Técnica Demo',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico-6',
    email: 'tecnico6@demo.local',
    nombre: 'Jorge Técnico Demo',
    passwordHash: hash('tecnico123'),
    role: 'TECNICO',
    empresaId: EMPRESA_DEMO,
    activo: true,
    esOwner: false,
  },
  {
    id: 'usr-demo-tecnico-7',
    email: 'tecnico7@demo.local',
    nombre: 'Camila Técnica Demo',
    passwordHash: hash('tecnico123'),
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
