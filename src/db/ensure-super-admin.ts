import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { upsertUserInStore, findUserByEmail } from '../data/users.seed';
import type { User } from '../types/user';
import { getPool, hasDatabase } from './pool';
import { upsertUser } from './persist';

const SUPER_ADMIN_ID = 'usr-super-admin';

/**
 * Asegura SUPER_ADMIN de plataforma (sin empresa).
 * Activo en QA y PROD (y local in-memory). Idempotente.
 */
export async function ensureSuperAdmin(): Promise<void> {
  const email = env.superAdminEmail;
  const password = env.superAdminPassword;
  if (!email || !password) {
    console.log('[db] SUPER_ADMIN skip — email/password vacíos');
    return;
  }

  if (findUserByEmail(email)) {
    console.log(`[db] SUPER_ADMIN already present (${email})`);
    return;
  }

  if (hasDatabase()) {
    const { rows } = await getPool().query<{ id: string }>(
      'SELECT id FROM users WHERE lower(email) = lower($1) OR id = $2 LIMIT 1',
      [email, SUPER_ADMIN_ID],
    );
    if (rows[0]) {
      console.log(`[db] SUPER_ADMIN already in DB (${email})`);
      return;
    }
  }

  const user: User = {
    id: SUPER_ADMIN_ID,
    email,
    nombre: env.superAdminNombre || 'Santiago Avila',
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'SUPER_ADMIN',
    empresaId: null,
  };

  if (hasDatabase()) {
    await upsertUser(user);
  }
  upsertUserInStore(user);
  console.log(`[db] SUPER_ADMIN created (${email}) — plataforma /suite`);
}
