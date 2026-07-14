import {
  EMPRESA_DEMO,
  EMPRESAS_SEED,
  findEmpresaById,
  hydrateEmpresas,
  upsertEmpresaInStore,
} from '../data/empresas.seed';
import {
  USERS_SEED,
  hydrateUsers,
  removeUsersByEmpresaFromStore,
  upsertUserInStore,
} from '../data/users.seed';
import { ASEGURADORAS_SEED } from '../data/aseguradoras.seed';
import { CATEGORIAS_COSTO_SEED, ITEMS_COSTO_SEED } from '../data/costos.seed';
import { PLANTILLAS_PDF_SEED } from '../data/plantillas-pdf.seed';
import { CASOS_SEED } from '../data/casos.seed';
import { casoRepository } from '../repositories/caso.repository';
import { catalogoRepository } from '../repositories/catalogo.repository';
import { costoRepository } from '../repositories/costo.repository';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import { getPool, hasDatabase } from './pool';
import { loadAllFromDb } from './hydrate';
import { upsertCaso, upsertPlantilla } from './persist';

const DEMO_USERS = USERS_SEED.filter((u) => u.empresaId === EMPRESA_DEMO);
const DEMO_EMPRESA = EMPRESAS_SEED.find((e) => e.id === EMPRESA_DEMO)!;
const DEMO_ASEG = ASEGURADORAS_SEED.filter((a) => a.empresaId === EMPRESA_DEMO);
const DEMO_CATS = CATEGORIAS_COSTO_SEED.filter((c) => c.empresaId === EMPRESA_DEMO);
const DEMO_ITEMS = ITEMS_COSTO_SEED.filter((i) => i.empresaId === EMPRESA_DEMO);
const DEMO_PLANTILLAS = PLANTILLAS_PDF_SEED.filter((p) => p.empresaId === EMPRESA_DEMO);
const DEMO_CASOS = CASOS_SEED.filter((c) => c.empresaId === EMPRESA_DEMO);

async function wipeDemoInDb(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM casos WHERE empresa_id = $1', [EMPRESA_DEMO]);
    await client.query('DELETE FROM items_costo WHERE empresa_id = $1', [EMPRESA_DEMO]);
    await client.query('DELETE FROM categorias_costo WHERE empresa_id = $1', [EMPRESA_DEMO]);
    await client.query('DELETE FROM plantillas_pdf WHERE empresa_id = $1', [EMPRESA_DEMO]);
    await client.query('DELETE FROM aseguradoras WHERE empresa_id = $1', [EMPRESA_DEMO]);
    await client.query('DELETE FROM users WHERE empresa_id = $1', [EMPRESA_DEMO]);
    // Conserva logo_data de la empresa
    await client.query(
      `UPDATE empresas SET nombre = $2, slug = $3, nit = $4 WHERE id = $1`,
      [EMPRESA_DEMO, DEMO_EMPRESA.nombre, DEMO_EMPRESA.slug, DEMO_EMPRESA.nit ?? ''],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function insertDemoSeedInDb(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO empresas (id, nombre, slug, nit, logo_data) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         slug = EXCLUDED.slug,
         nit = EXCLUDED.nit`,
      [DEMO_EMPRESA.id, DEMO_EMPRESA.nombre, DEMO_EMPRESA.slug, DEMO_EMPRESA.nit ?? '', null],
    );

    for (const u of DEMO_USERS) {
      await client.query(
        `INSERT INTO users (id, email, nombre, password_hash, role, empresa_id, activo, es_owner)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           nombre = EXCLUDED.nombre,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           empresa_id = EXCLUDED.empresa_id,
           activo = EXCLUDED.activo,
           es_owner = EXCLUDED.es_owner`,
        [
          u.id,
          u.email,
          u.nombre,
          u.passwordHash,
          u.role,
          u.empresaId,
          u.activo !== false,
          Boolean(u.esOwner),
        ],
      );
    }

    for (const a of DEMO_ASEG) {
      await client.query(
        `INSERT INTO aseguradoras
          (id, empresa_id, nombre, nit, persona_responsable, contacto_cobros, whatsapp, activa)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          a.id,
          a.empresaId,
          a.nombre,
          a.nit,
          a.personaResponsable,
          a.contactoCobros,
          a.whatsapp,
          a.activa,
        ],
      );
    }

    for (const cat of DEMO_CATS) {
      await client.query(
        `INSERT INTO categorias_costo
          (id, empresa_id, nombre, descripcion, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.empresaId, cat.nombre, cat.descripcion, cat.createdAt, cat.updatedAt],
      );
    }

    for (const item of DEMO_ITEMS) {
      await client.query(
        `INSERT INTO items_costo
          (id, empresa_id, categoria_id, nombre, descripcion, costo_interno,
           precio_sugerido, unidad, activo, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.empresaId,
          item.categoriaId,
          item.nombre,
          item.descripcion,
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

  for (const p of DEMO_PLANTILLAS) {
    await upsertPlantilla(p);
  }
  for (const caso of DEMO_CASOS) {
    await upsertCaso(caso);
  }
}

function reseedDemoInMemory(): void {
  const existing = findEmpresaById(EMPRESA_DEMO);
  upsertEmpresaInStore({
    ...DEMO_EMPRESA,
    logoDataUrl: existing?.logoDataUrl ?? null,
  });
  removeUsersByEmpresaFromStore(EMPRESA_DEMO);
  for (const u of DEMO_USERS) {
    upsertUserInStore(structuredClone(u));
  }

  catalogoRepository.hydrate(
    [
      ...catalogoRepository.listAllAseguradoras().filter((a) => a.empresaId !== EMPRESA_DEMO),
      ...structuredClone(DEMO_ASEG),
    ],
    catalogoRepository.listCiudades(false),
  );

  costoRepository.hydrate(
    [
      ...costoRepository.listAllCategorias().filter((c) => c.empresaId !== EMPRESA_DEMO),
      ...structuredClone(DEMO_CATS),
    ],
    [
      ...costoRepository.listAllItems().filter((i) => i.empresaId !== EMPRESA_DEMO),
      ...structuredClone(DEMO_ITEMS),
    ],
  );

  plantillaPdfRepository.hydrate([
    ...plantillaPdfRepository.listAll().filter((p) => p.empresaId !== EMPRESA_DEMO),
    ...structuredClone(DEMO_PLANTILLAS),
  ]);

  casoRepository.hydrate([
    ...casoRepository.findAll().filter((c) => c.empresaId !== EMPRESA_DEMO),
    ...structuredClone(DEMO_CASOS),
  ]);
}

/**
 * Restaura DEMO a datos seed (casos, tarifas, clientes, plantilla, usuarios demo).
 * Con DATABASE_URL escribe en Postgres y rehidrata memoria.
 */
export async function reseedDemoTenant(): Promise<{ casos: number; users: number }> {
  if (hasDatabase()) {
    await wipeDemoInDb();
    await insertDemoSeedInDb();
    const data = await loadAllFromDb();
    hydrateEmpresas(data.empresas);
    hydrateUsers(data.users);
    catalogoRepository.hydrate(data.aseguradoras, data.ciudades);
    costoRepository.hydrate(data.categorias, data.items);
    plantillaPdfRepository.hydrate(data.plantillas);
    casoRepository.hydrate(data.casos);
    return {
      casos: data.casos.filter((c) => c.empresaId === EMPRESA_DEMO).length,
      users: data.users.filter((u) => u.empresaId === EMPRESA_DEMO).length,
    };
  }

  reseedDemoInMemory();
  return {
    casos: casoRepository.findByEmpresa(EMPRESA_DEMO).length,
    users: DEMO_USERS.length,
  };
}
