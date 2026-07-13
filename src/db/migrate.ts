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
    NULL;
END $$;

-- Clientes (aseguradoras) por empresa, como tarifas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'aseguradoras'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'aseguradoras' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE aseguradoras ADD COLUMN empresa_id TEXT REFERENCES empresas (id);
    -- Filas legacy globales → DEMO (o primera empresa)
    UPDATE aseguradoras a
       SET empresa_id = COALESCE(
         (SELECT id FROM empresas WHERE id = 'emp-demo' LIMIT 1),
         (SELECT id FROM empresas ORDER BY nombre LIMIT 1)
       )
     WHERE a.empresa_id IS NULL;
    DELETE FROM aseguradoras WHERE empresa_id IS NULL;
    ALTER TABLE aseguradoras ALTER COLUMN empresa_id SET NOT NULL;
  END IF;

  -- Quitar UNIQUE global en nombre si existía
  ALTER TABLE aseguradoras DROP CONSTRAINT IF EXISTS aseguradoras_nombre_key;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS aseguradoras_empresa_nombre_uidx
  ON aseguradoras (empresa_id, lower(nombre));

-- NIT en empresas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'nit'
  ) THEN
    ALTER TABLE empresas ADD COLUMN nit TEXT NOT NULL DEFAULT '';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- users.activo (desactivar sin borrar)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'activo'
  ) THEN
    ALTER TABLE users ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- OWNER de empresa (propietario)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'es_owner'
  ) THEN
    ALTER TABLE users ADD COLUMN es_owner BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Logo 1:1 de empresa (data URL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'empresas'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'empresas' AND column_name = 'logo_data'
  ) THEN
    ALTER TABLE empresas ADD COLUMN logo_data TEXT;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;
`;

export async function migrate(): Promise<void> {
  const pool = getPool();
  await pool.query(SCHEMA_SQL);
  await pool.query(PATCHES_SQL);
  console.log('[db] schema applied');
}
