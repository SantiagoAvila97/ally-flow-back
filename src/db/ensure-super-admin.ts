import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import {
  upsertUserInStore,
  findUserByEmail,
  findUserById,
} from '../data/users.seed';
import type { User } from '../types/user';
import { getPool, hasDatabase } from './pool';
import { upsertUser } from './persist';

const SUPER_ADMIN_ID = 'usr-super-admin';

/**
 * Asegura SUPER_ADMIN de plataforma (sin empresa).
 * Credenciales según APP_ENV (QA ≠ PROD). Idempotente: actualiza email/clave si cambian.
 */
export async function ensureSuperAdmin(): Promise<void> {
  const email = env.superAdminEmail;
  const password = env.superAdminPassword;
  if (!email || !password) {
    console.log('[db] SUPER_ADMIN skip — email/password vacíos');
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user: User = {
    id: SUPER_ADMIN_ID,
    email,
    nombre: env.superAdminNombre || 'Super Admin',
    passwordHash,
    role: 'SUPER_ADMIN',
    empresaId: null,
  };

  const existingById = findUserById(SUPER_ADMIN_ID);
  const existingByEmail = findUserByEmail(email);

  if (hasDatabase()) {
    await upsertUser(user);
    // Si quedó un SUPER_ADMIN viejo con otro email, lo alineamos por id.
  }

  upsertUserInStore(user);

  // Evita duplicado en memoria si había otro email
  if (existingByEmail && existingByEmail.id !== SUPER_ADMIN_ID) {
    console.warn(
      `[db] SUPER_ADMIN email ${email} ya existía en otro id (${existingByEmail.id}); preferido ${SUPER_ADMIN_ID}`,
    );
  }

  if (existingById || (hasDatabase() && (await dbHasSuperAdmin()))) {
    console.log(`[db] SUPER_ADMIN upserted (${email}) [${env.appEnv}]`);
  } else {
    console.log(`[db] SUPER_ADMIN created (${email}) [${env.appEnv}] — /suite`);
  }
}

async function dbHasSuperAdmin(): Promise<boolean> {
  if (!hasDatabase()) return false;
  const { rows } = await getPool().query<{ id: string }>(
    'SELECT id FROM users WHERE id = $1 LIMIT 1',
    [SUPER_ADMIN_ID],
  );
  return Boolean(rows[0]);
}
