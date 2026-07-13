export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ASESOR', 'TECNICO')),
  empresa_id TEXT NOT NULL REFERENCES empresas (id)
);

CREATE TABLE IF NOT EXISTS aseguradoras (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  nit TEXT,
  persona_responsable TEXT,
  contacto_cobros TEXT,
  whatsapp TEXT,
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ciudades (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'bogota-area',
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS categorias_costo (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas (id),
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS items_costo (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas (id),
  categoria_id TEXT NOT NULL REFERENCES categorias_costo (id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  costo_interno NUMERIC NOT NULL DEFAULT 0,
  precio_sugerido NUMERIC NOT NULL DEFAULT 0,
  unidad TEXT NOT NULL DEFAULT 'und',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS plantillas_pdf (
  id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas (id),
  aseguradora_id TEXT REFERENCES aseguradoras (id),
  razon_social TEXT NOT NULL,
  nit TEXT NOT NULL DEFAULT '',
  ciudad TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  color_acento TEXT NOT NULL DEFAULT '#0f766e',
  texto_header TEXT NOT NULL DEFAULT '',
  texto_footer TEXT NOT NULL DEFAULT '',
  tipo_plantilla TEXT NOT NULL DEFAULT 'tabla_operativa',
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS plantillas_pdf_empresa_default_uidx
  ON plantillas_pdf (empresa_id)
  WHERE aseguradora_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS plantillas_pdf_empresa_aseg_uidx
  ON plantillas_pdf (empresa_id, aseguradora_id)
  WHERE aseguradora_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS casos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  cliente TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL,
  empresa_id TEXT NOT NULL REFERENCES empresas (id),
  asesor_id TEXT NOT NULL,
  tecnico_id TEXT,
  numero_aseguradora TEXT NOT NULL DEFAULT '',
  aseguradora TEXT NOT NULL DEFAULT '',
  titular_nombre TEXT NOT NULL DEFAULT '',
  titular_telefono TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  ciudad TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  direccion_normalizada TEXT,
  categoria_servicio TEXT NOT NULL DEFAULT '',
  observaciones TEXT NOT NULL DEFAULT '',
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  firma_atendido_url TEXT,
  firma_tecnico_url TEXT,
  gestionado_at TIMESTAMPTZ,
  es_garantia BOOLEAN NOT NULL DEFAULT FALSE,
  caso_origen_id TEXT,
  monto_estimado NUMERIC,
  lineas_cobro JSONB NOT NULL DEFAULT '[]'::jsonb,
  documento_cobro_generado_at TIMESTAMPTZ,
  historial_cambios JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS casos_empresa_idx ON casos (empresa_id);
CREATE INDEX IF NOT EXISTS casos_estado_idx ON casos (estado);
CREATE INDEX IF NOT EXISTS items_costo_empresa_idx ON items_costo (empresa_id);
CREATE INDEX IF NOT EXISTS categorias_costo_empresa_idx ON categorias_costo (empresa_id);
`;
