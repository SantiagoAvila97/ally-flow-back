import { env } from '../config/env';
import { EMPRESAS_SEED } from '../data/empresas.seed';
import { USERS_SEED } from '../data/users.seed';
import { ASEGURADORAS_SEED } from '../data/aseguradoras.seed';
import { CIUDADES_CATALOGO_SEED } from '../data/ciudades-catalogo.seed';
import { CATEGORIAS_COSTO_SEED, ITEMS_COSTO_SEED } from '../data/costos.seed';
import { PLANTILLAS_PDF_SEED } from '../data/plantillas-pdf.seed';
import { CASOS_SEED } from '../data/casos.seed';
import { getPool } from './pool';
import { upsertCaso, upsertPlantilla } from './persist';

export async function isDatabaseEmpty(): Promise<boolean> {
  const { rows } = await getPool().query<{ c: string }>(
    'SELECT COUNT(*)::text AS c FROM empresas',
  );
  return Number(rows[0]?.c ?? 0) === 0;
}

/**
 * Seed demo (empresas Full + DEMO, usuarios, tarifas; casos solo en DEMO).
 * - QA / local: sí, si la DB está vacía.
 * - PROD: no, salvo SEED_DEMO=true.
 */
export async function seedIfEmpty(): Promise<void> {
  const forceDemo = process.env.SEED_DEMO === 'true' || process.env.SEED_DEMO === '1';
  if (env.appEnv === 'prod' && !forceDemo) {
    console.log('[db] APP_ENV=prod — skip demo seed (crea empresa/admin en Neon SQL Editor)');
    return;
  }

  if (!(await isDatabaseEmpty())) {
    console.log('[db] already seeded — skip');
    return;
  }

  console.log('[db] empty database — loading demo seed…');
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const e of EMPRESAS_SEED) {
      await client.query(
        `INSERT INTO empresas (id, nombre, slug) VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.nombre, e.slug],
      );
    }

    for (const u of USERS_SEED) {
      await client.query(
        `INSERT INTO users (id, email, nombre, password_hash, role, empresa_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.email, u.nombre, u.passwordHash, u.role, u.empresaId],
      );
    }

    for (const a of ASEGURADORAS_SEED) {
      await client.query(
        `INSERT INTO aseguradoras
          (id, nombre, nit, persona_responsable, contacto_cobros, whatsapp, activa)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          a.id,
          a.nombre,
          a.nit,
          a.personaResponsable,
          a.contactoCobros,
          a.whatsapp,
          a.activa,
        ],
      );
    }

    for (const c of CIUDADES_CATALOGO_SEED) {
      await client.query(
        `INSERT INTO ciudades (id, nombre, area, activa)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.nombre, c.area, c.activa],
      );
    }

    for (const cat of CATEGORIAS_COSTO_SEED) {
      await client.query(
        `INSERT INTO categorias_costo
          (id, empresa_id, nombre, descripcion, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.empresaId, cat.nombre, cat.descripcion, cat.createdAt, cat.updatedAt],
      );
    }

    for (const item of ITEMS_COSTO_SEED) {
      await client.query(
        `INSERT INTO items_costo
          (id, empresa_id, categoria_id, nombre, descripcion, costo_interno,
           precio_sugerido, unidad, activo, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.empresaId,
          item.categoriaId,
          item.nombre,
          item.descripcion,
          item.costoInterno,
          item.precioSugerido,
          item.unidad,
          item.activo,
          item.createdAt,
          item.updatedAt,
        ],
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  for (const p of PLANTILLAS_PDF_SEED) {
    await upsertPlantilla(p);
  }
  for (const caso of CASOS_SEED) {
    await upsertCaso(caso);
  }

  console.log('[db] seed completed');
}
