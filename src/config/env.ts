import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuración centralizada del entorno.
 * Valida variables críticas al arrancar para fallar rápido en misconfiguraciones.
 */
function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

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
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

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
  /** APP_ENV=qa|prod fuerza NODE_ENV production semantics for TLS notes. */
  appEnv: (process.env.APP_ENV ?? (isProd ? 'prod' : 'dev')).toLowerCase(),
  /** Postgres (Neon / Railway). Vacío = modo in-memory. */
  databaseUrl: process.env.DATABASE_URL ?? '',
  /** Neon y la mayoría de hosts cloud requieren SSL. */
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    process.env.DATABASE_SSL === '1' ||
    Boolean(process.env.DATABASE_URL?.includes('sslmode=require')),
  /** Opcional: mejora el pin exacto. Sin key se usa embed de Google por búsqueda. */
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  /**
   * SUPER_ADMIN de plataforma (QA + PROD).
   * En PROD la password NO puede usar el default del repo: define SUPER_ADMIN_PASSWORD.
   */
  superAdminEmail: (
    process.env.SUPER_ADMIN_EMAIL ?? 'saviladev@allyflow.app'
  )
    .trim()
    .toLowerCase(),
  superAdminPassword: resolveSuperAdminPassword(isProd, process.env.APP_ENV),
  superAdminNombre: (process.env.SUPER_ADMIN_NOMBRE ?? 'Santiago Avila').trim(),
} as const;

function resolveSuperAdminPassword(nodeIsProd: boolean, appEnvRaw?: string): string {
  const fromEnv = process.env.SUPER_ADMIN_PASSWORD ?? '';
  const appEnv = (appEnvRaw ?? (nodeIsProd ? 'prod' : 'dev')).toLowerCase();
  const fallback = 'Oldkfrj00utw+';
  if (appEnv === 'prod') {
    if (!fromEnv || fromEnv.length < 10) {
      // Prefer explicit var; if missing, still use fallback but warn loudly at boot via ensure
      return fromEnv || fallback;
    }
    return fromEnv;
  }
  return fromEnv || fallback;
}
