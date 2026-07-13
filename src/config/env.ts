import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';
const appEnv = (process.env.APP_ENV ?? (isProd ? 'prod' : 'dev')).toLowerCase();

function resolveJwtSecret(): string {
  const value = process.env.JWT_SECRET;
  const weak = 'ally-flow-dev-secret-change-in-production';
  if (isProd) {
    if (!value || value === weak || value.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong value (≥32 chars) when NODE_ENV=production',
      );
    }
    return value;
  }
  return value || weak;
}

function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN ?? '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // ng serve local → API QA/PROD: siempre permitir localhost fuera de prod estricto.
  // En prod solo lo que venga en CORS_ORIGIN (front de Vercel).
  const localDev =
    appEnv === 'prod'
      ? []
      : ['http://localhost:4200', 'http://127.0.0.1:4200'];

  const merged = [...new Set([...fromEnv, ...localDev])];
  if (merged.length === 0) {
    return ['http://localhost:4200'];
  }
  return merged;
}

/** Defaults distintos QA vs PROD (override con SUPER_ADMIN_* en Railway). */
function resolveSuperAdminDefaults(): {
  email: string;
  password: string;
  nombre: string;
} {
  if (appEnv === 'prod') {
    return {
      email: 'saviladev@allyflow.app',
      password: 'Oldkfrj00utw+',
      nombre: 'Santiago Avila',
    };
  }
  // QA + local/dev: cuenta de prueba, password distinta a PROD
  return {
    email: 'superadmin.qa@allyflow.app',
    password: 'QaSuperAdmin#2026!',
    nombre: 'Super Admin QA',
  };
}

const superDefaults = resolveSuperAdminDefaults();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: resolveJwtSecret(),
  /** Vigencia del access token (turno laboral por defecto). */
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  jwtIssuer: process.env.JWT_ISSUER ?? 'ally-flow',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'ally-flow-api',
  /** Orígenes permitidos (CORS_ORIGIN separado por comas). */
  corsOrigins: resolveCorsOrigins(),
  /** Compat: primer origen. */
  corsOrigin: resolveCorsOrigins()[0] ?? 'http://localhost:4200',
  nodeEnv,
  isProd,
  appEnv,
  /** Postgres (Neon / Railway). Vacío = modo in-memory. */
  databaseUrl: process.env.DATABASE_URL ?? '',
  /** Neon y la mayoría de hosts cloud requieren SSL. */
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    process.env.DATABASE_SSL === '1' ||
    Boolean(process.env.DATABASE_URL?.includes('sslmode=require')),
  /** Opcional: mejora el pin exacto. Sin key se usa embed de Google por búsqueda. */
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL ?? superDefaults.email)
    .trim()
    .toLowerCase(),
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD ?? superDefaults.password,
  superAdminNombre: (process.env.SUPER_ADMIN_NOMBRE ?? superDefaults.nombre).trim(),
} as const;
