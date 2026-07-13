import type { Aseguradora, CiudadCatalogo } from '../types/catalogo';
import type { Caso } from '../types/caso';
import type { CategoriaCosto, ItemCosto } from '../types/costo';
import type { PlantillaPdfCobro } from '../types/plantilla-pdf';
import { EMPTY_PLANTILLA_EXTRAS } from '../types/plantilla-pdf';
import { getPool, hasDatabase } from './pool';

let persistenceEnabled = false;

export function enablePersistence(on = true): void {
  persistenceEnabled = on && hasDatabase();
}

export function isPersistenceEnabled(): boolean {
  return persistenceEnabled;
}

export function fireAndForget(task: Promise<unknown>, label: string): void {
  task.catch((err) => {
    console.error(`[db] persist failed (${label}):`, err);
  });
}

function runtimeOnly(): boolean {
  return !persistenceEnabled || !hasDatabase();
}

export async function upsertCaso(caso: Caso): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO casos (
      id, titulo, descripcion, cliente, estado, empresa_id, asesor_id, tecnico_id,
      numero_aseguradora, aseguradora, titular_nombre, titular_telefono, direccion, ciudad,
      lat, lon, direccion_normalizada, categoria_servicio, observaciones,
      fotos, firma_atendido_url, firma_tecnico_url, gestionado_at,
      es_garantia, caso_origen_id, monto_estimado, lineas_cobro,
      documento_cobro_generado_at, historial_cambios, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
      $20::jsonb,$21,$22,$23,$24,$25,$26,$27::jsonb,$28,$29::jsonb,$30,$31
    )
    ON CONFLICT (id) DO UPDATE SET
      titulo = EXCLUDED.titulo,
      descripcion = EXCLUDED.descripcion,
      cliente = EXCLUDED.cliente,
      estado = EXCLUDED.estado,
      empresa_id = EXCLUDED.empresa_id,
      asesor_id = EXCLUDED.asesor_id,
      tecnico_id = EXCLUDED.tecnico_id,
      numero_aseguradora = EXCLUDED.numero_aseguradora,
      aseguradora = EXCLUDED.aseguradora,
      titular_nombre = EXCLUDED.titular_nombre,
      titular_telefono = EXCLUDED.titular_telefono,
      direccion = EXCLUDED.direccion,
      ciudad = EXCLUDED.ciudad,
      lat = EXCLUDED.lat,
      lon = EXCLUDED.lon,
      direccion_normalizada = EXCLUDED.direccion_normalizada,
      categoria_servicio = EXCLUDED.categoria_servicio,
      observaciones = EXCLUDED.observaciones,
      fotos = EXCLUDED.fotos,
      firma_atendido_url = EXCLUDED.firma_atendido_url,
      firma_tecnico_url = EXCLUDED.firma_tecnico_url,
      gestionado_at = EXCLUDED.gestionado_at,
      es_garantia = EXCLUDED.es_garantia,
      caso_origen_id = EXCLUDED.caso_origen_id,
      monto_estimado = EXCLUDED.monto_estimado,
      lineas_cobro = EXCLUDED.lineas_cobro,
      documento_cobro_generado_at = EXCLUDED.documento_cobro_generado_at,
      historial_cambios = EXCLUDED.historial_cambios,
      updated_at = EXCLUDED.updated_at`,
    [
      caso.id,
      caso.titulo,
      caso.descripcion,
      caso.cliente,
      caso.estado,
      caso.empresaId,
      caso.asesorId,
      caso.tecnicoId,
      caso.numeroAseguradora,
      caso.aseguradora,
      caso.titularNombre,
      caso.titularTelefono,
      caso.direccion,
      caso.ciudad,
      caso.lat,
      caso.lon,
      caso.direccionNormalizada,
      caso.categoriaServicio,
      caso.observaciones,
      JSON.stringify(caso.fotos ?? []),
      caso.firmaAtendidoUrl,
      caso.firmaTecnicoUrl,
      caso.gestionadoAt,
      caso.esGarantia,
      caso.casoOrigenId,
      caso.montoEstimado,
      JSON.stringify(caso.lineasCobro ?? []),
      caso.documentoCobroGeneradoAt,
      JSON.stringify(caso.historialCambios ?? []),
      caso.createdAt,
      caso.updatedAt,
    ],
  );
}

export function persistCaso(caso: Caso): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertCaso(caso), 'caso');
}

export async function upsertCategoria(cat: CategoriaCosto): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO categorias_costo
      (id, empresa_id, nombre, descripcion, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion,
      updated_at = EXCLUDED.updated_at`,
    [cat.id, cat.empresaId, cat.nombre, cat.descripcion, cat.createdAt, cat.updatedAt],
  );
}

export function persistCategoria(cat: CategoriaCosto): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertCategoria(cat), 'categoria');
}

export async function deleteCategoriaDb(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query('DELETE FROM categorias_costo WHERE id = $1', [id]);
}

export function persistDeleteCategoria(id: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deleteCategoriaDb(id), 'delete-categoria');
}

export async function upsertItem(item: ItemCosto): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO items_costo
      (id, empresa_id, categoria_id, nombre, descripcion, costo_interno,
       precio_sugerido, unidad, activo, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (id) DO UPDATE SET
      categoria_id = EXCLUDED.categoria_id,
      nombre = EXCLUDED.nombre,
      descripcion = EXCLUDED.descripcion,
      costo_interno = EXCLUDED.costo_interno,
      precio_sugerido = EXCLUDED.precio_sugerido,
      unidad = EXCLUDED.unidad,
      activo = EXCLUDED.activo,
      updated_at = EXCLUDED.updated_at`,
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

export function persistItem(item: ItemCosto): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertItem(item), 'item');
}

export async function deleteItemDb(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query('DELETE FROM items_costo WHERE id = $1', [id]);
}

export function persistDeleteItem(id: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deleteItemDb(id), 'delete-item');
}

export async function deleteItemsByCategoriaDb(categoriaId: string): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query('DELETE FROM items_costo WHERE categoria_id = $1', [categoriaId]);
}

export function persistDeleteItemsByCategoria(categoriaId: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deleteItemsByCategoriaDb(categoriaId), 'delete-items-cat');
}

export async function upsertAseguradora(a: Aseguradora): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO aseguradoras
      (id, empresa_id, nombre, nit, persona_responsable, contacto_cobros, whatsapp, activa)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
      empresa_id = EXCLUDED.empresa_id,
      nombre = EXCLUDED.nombre,
      nit = EXCLUDED.nit,
      persona_responsable = EXCLUDED.persona_responsable,
      contacto_cobros = EXCLUDED.contacto_cobros,
      whatsapp = EXCLUDED.whatsapp,
      activa = EXCLUDED.activa`,
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

export function persistAseguradora(a: Aseguradora): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertAseguradora(a), 'aseguradora');
}

export async function deleteAseguradoraDb(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query('DELETE FROM aseguradoras WHERE id = $1', [id]);
}

export function persistDeleteAseguradora(id: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deleteAseguradoraDb(id), 'delete-aseguradora');
}

export async function upsertCiudad(c: CiudadCatalogo): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO ciudades (id, nombre, area, activa)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      area = EXCLUDED.area,
      activa = EXCLUDED.activa`,
    [c.id, c.nombre, c.area, c.activa],
  );
}

export function persistCiudad(c: CiudadCatalogo): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertCiudad(c), 'ciudad');
}

export async function deleteCiudadDb(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query('DELETE FROM ciudades WHERE id = $1', [id]);
}

export function persistDeleteCiudad(id: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deleteCiudadDb(id), 'delete-ciudad');
}

export async function upsertPlantilla(p: PlantillaPdfCobro): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO plantillas_pdf (
      id, empresa_id, aseguradora_id, razon_social, nit, ciudad, telefono, email,
      color_acento, texto_header, texto_footer, tipo_plantilla, extras, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)
    ON CONFLICT (id) DO UPDATE SET
      aseguradora_id = EXCLUDED.aseguradora_id,
      razon_social = EXCLUDED.razon_social,
      nit = EXCLUDED.nit,
      ciudad = EXCLUDED.ciudad,
      telefono = EXCLUDED.telefono,
      email = EXCLUDED.email,
      color_acento = EXCLUDED.color_acento,
      texto_header = EXCLUDED.texto_header,
      texto_footer = EXCLUDED.texto_footer,
      tipo_plantilla = EXCLUDED.tipo_plantilla,
      extras = EXCLUDED.extras,
      updated_at = EXCLUDED.updated_at`,
    [
      p.id,
      p.empresaId,
      p.aseguradoraId,
      p.razonSocial,
      p.nit,
      p.ciudad,
      p.telefono,
      p.email,
      p.colorAcento,
      p.textoHeader,
      p.textoFooter,
      p.tipoPlantilla,
      JSON.stringify(p.extras ?? EMPTY_PLANTILLA_EXTRAS),
      p.updatedAt,
    ],
  );
}

export function persistPlantilla(p: PlantillaPdfCobro): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertPlantilla(p), 'plantilla');
}

export async function deletePlantillaDb(id: string): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query('DELETE FROM plantillas_pdf WHERE id = $1', [id]);
}

export function persistDeletePlantilla(id: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deletePlantillaDb(id), 'delete-plantilla');
}

export async function upsertEmpresa(e: {
  id: string;
  nombre: string;
  slug: string;
  nit?: string;
  logoDataUrl?: string | null;
}): Promise<void> {
  if (!hasDatabase()) return;
  await getPool().query(
    `INSERT INTO empresas (id, nombre, slug, nit, logo_data) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       slug = EXCLUDED.slug,
       nit = EXCLUDED.nit,
       logo_data = EXCLUDED.logo_data`,
    [e.id, e.nombre, e.slug, e.nit ?? '', e.logoDataUrl ?? null],
  );
}

export function persistEmpresa(e: {
  id: string;
  nombre: string;
  slug: string;
  nit?: string;
  logoDataUrl?: string | null;
}): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertEmpresa(e), 'empresa');
}

export async function upsertUser(u: {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  role: string;
  empresaId: string | null;
  activo?: boolean;
  esOwner?: boolean;
}): Promise<void> {
  if (!hasDatabase()) return;
  const activo = u.activo !== false;
  const esOwner = Boolean(u.esOwner);
  await getPool().query(
    `INSERT INTO users (id, email, nombre, password_hash, role, empresa_id, activo, es_owner)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       nombre = EXCLUDED.nombre,
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       empresa_id = EXCLUDED.empresa_id,
       activo = EXCLUDED.activo,
       es_owner = EXCLUDED.es_owner`,
    [u.id, u.email, u.nombre, u.passwordHash, u.role, u.empresaId, activo, esOwner],
  );
}

export function persistUser(u: {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
  role: string;
  empresaId: string | null;
  activo?: boolean;
  esOwner?: boolean;
}): void {
  if (runtimeOnly()) return;
  fireAndForget(upsertUser(u), 'user');
}

/** Borrado total de un tenant y dependencias (solo QA/local vía service). */
export async function deleteEmpresaCascade(empresaId: string): Promise<void> {
  if (!hasDatabase()) return;
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM casos WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM items_costo WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM categorias_costo WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM plantillas_pdf WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM aseguradoras WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM users WHERE empresa_id = $1', [empresaId]);
    await client.query('DELETE FROM empresas WHERE id = $1', [empresaId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function persistDeleteEmpresaCascade(empresaId: string): void {
  if (runtimeOnly()) return;
  fireAndForget(deleteEmpresaCascade(empresaId), 'delete-empresa');
}

