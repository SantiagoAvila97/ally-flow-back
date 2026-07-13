import { getPool } from './pool';
import { SCHEMA_SQL } from './schema';

/**
 * CREATE IF NOT EXISTS no altera tablas viejas: aplicamos patches idempotentes.
 */
const PATCHES_SQL = `
DO $$
BEGIN
  -- role CHECK incluye SUPER_ADMIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'ASESOR', 'TECNICO', 'SUPER_ADMIN'));

  -- SUPER_ADMIN sin tenant
  ALTER TABLE users ALTER COLUMN empresa_id DROP NOT NULL;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- schema aún no creado; CREATE TABLE arriba lo define bien
END $$;
`;

export async function migrate(): Promise<void> {
  const pool = getPool();
  await pool.query(SCHEMA_SQL);
  await pool.query(PATCHES_SQL);
  console.log('[db] schema applied');
}
