import { EMPTY_PLANTILLA_EXTRAS } from '../types/plantilla-pdf';
import type { Aseguradora, CiudadCatalogo } from '../types/catalogo';
import type { Caso } from '../types/caso';
import type { CategoriaCosto, ItemCosto } from '../types/costo';
import type { Empresa } from '../types/empresa';
import type { PlantillaPdfCobro } from '../types/plantilla-pdf';
import type { User } from '../types/user';
import { getPool } from './pool';

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export async function loadAllFromDb(): Promise<{
  empresas: Empresa[];
  users: User[];
  aseguradoras: Aseguradora[];
  ciudades: CiudadCatalogo[];
  categorias: CategoriaCosto[];
  items: ItemCosto[];
  plantillas: PlantillaPdfCobro[];
  casos: Caso[];
}> {
  const pool = getPool();

  const [
    empresasRes,
    usersRes,
    asegRes,
    ciudadesRes,
    catsRes,
    itemsRes,
    plantillasRes,
    casosRes,
  ] = await Promise.all([
    pool.query('SELECT id, nombre, slug, nit, logo_data FROM empresas ORDER BY nombre'),
    pool.query(
      'SELECT id, email, nombre, password_hash, role, empresa_id, activo, es_owner FROM users ORDER BY email',
    ),
    pool.query(
      `SELECT id, empresa_id, nombre, nit, persona_responsable, contacto_cobros, whatsapp, activa
       FROM aseguradoras ORDER BY nombre`,
    ),
    pool.query('SELECT id, nombre, area, activa FROM ciudades ORDER BY nombre'),
    pool.query(
      `SELECT id, empresa_id, nombre, descripcion, created_at, updated_at
       FROM categorias_costo`,
    ),
    pool.query(
      `SELECT id, empresa_id, categoria_id, nombre, descripcion, costo_interno,
              precio_sugerido, unidad, activo, created_at, updated_at
       FROM items_costo`,
    ),
    pool.query(
      `SELECT id, empresa_id, aseguradora_id, razon_social, nit, ciudad, telefono, email,
              color_acento, texto_header, texto_footer, tipo_plantilla, extras, updated_at
       FROM plantillas_pdf`,
    ),
    pool.query('SELECT * FROM casos ORDER BY updated_at DESC'),
  ]);

  const empresas: Empresa[] = empresasRes.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    slug: r.slug,
    nit: r.nit ?? '',
    logoDataUrl: r.logo_data ?? null,
  }));

  const users: User[] = usersRes.rows.map((r) => ({
    id: r.id,
    email: r.email,
    nombre: r.nombre,
    passwordHash: r.password_hash,
    role: r.role,
    empresaId: r.empresa_id ?? null,
    activo: r.activo !== false,
    esOwner: Boolean(r.es_owner),
  }));

  const aseguradoras: Aseguradora[] = asegRes.rows.map((r) => ({
    id: r.id,
    empresaId: r.empresa_id,
    nombre: r.nombre,
    nit: r.nit,
    personaResponsable: r.persona_responsable,
    contactoCobros: r.contacto_cobros,
    whatsapp: r.whatsapp,
    activa: r.activa,
  }));

  const ciudades: CiudadCatalogo[] = ciudadesRes.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    area: r.area,
    activa: r.activa,
  }));

  const categorias: CategoriaCosto[] = catsRes.rows.map((r) => ({
    id: r.id,
    empresaId: r.empresa_id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));

  const items: ItemCosto[] = itemsRes.rows.map((r) => ({
    id: r.id,
    empresaId: r.empresa_id,
    categoriaId: r.categoria_id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? '',
    costoInterno: Number(r.costo_interno),
    precioSugerido: Number(r.precio_sugerido),
    unidad: r.unidad,
    activo: r.activo,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));

  const plantillas: PlantillaPdfCobro[] = plantillasRes.rows.map((r) => ({
    id: r.id,
    empresaId: r.empresa_id,
    aseguradoraId: r.aseguradora_id,
    razonSocial: r.razon_social,
    nit: r.nit ?? '',
    ciudad: r.ciudad ?? '',
    telefono: r.telefono ?? '',
    email: r.email ?? '',
    colorAcento: r.color_acento ?? '#0f766e',
    textoHeader: r.texto_header ?? '',
    textoFooter: r.texto_footer ?? '',
    tipoPlantilla: r.tipo_plantilla,
    extras: { ...EMPTY_PLANTILLA_EXTRAS, ...(r.extras ?? {}) },
    updatedAt: new Date(r.updated_at).toISOString(),
  }));

  const casos: Caso[] = casosRes.rows.map((r) => ({
    id: r.id,
    titulo: r.titulo,
    descripcion: r.descripcion ?? '',
    cliente: r.cliente ?? '',
    estado: r.estado,
    empresaId: r.empresa_id,
    asesorId: r.asesor_id,
    tecnicoId: r.tecnico_id,
    numeroAseguradora: r.numero_aseguradora ?? '',
    aseguradora: r.aseguradora ?? '',
    titularNombre: r.titular_nombre ?? '',
    titularTelefono: r.titular_telefono ?? '',
    direccion: r.direccion ?? '',
    ciudad: r.ciudad ?? '',
    lat: num(r.lat),
    lon: num(r.lon),
    direccionNormalizada: r.direccion_normalizada,
    categoriaServicio: r.categoria_servicio ?? '',
    observaciones: r.observaciones ?? '',
    fotos: r.fotos ?? [],
    firmaAtendidoUrl: r.firma_atendido_url,
    firmaTecnicoUrl: r.firma_tecnico_url,
    gestionadoAt: r.gestionado_at ? new Date(r.gestionado_at).toISOString() : null,
    esGarantia: r.es_garantia,
    casoOrigenId: r.caso_origen_id,
    montoEstimado: num(r.monto_estimado),
    lineasCobro: r.lineas_cobro ?? [],
    documentoCobroGeneradoAt: r.documento_cobro_generado_at
      ? new Date(r.documento_cobro_generado_at).toISOString()
      : null,
    historialCambios: r.historial_cambios ?? [],
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));

  return { empresas, users, aseguradoras, ciudades, categorias, items, plantillas, casos };
}
