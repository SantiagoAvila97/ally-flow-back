import { Pool } from 'pg';
import { env } from '../config/env';

let pool: Pool | null = null;

export function hasDatabase(): boolean {
  return Boolean(env.databaseUrl);
}

export function getPool(): Pool {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 15_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
