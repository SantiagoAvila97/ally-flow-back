import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

/**
 * APP_ENV canónico:
 * - prod  → producción (cuidado)
 * - qa    → Railway QA (alineado con local en producto)
 * - dev   → ng serve / API local
 *
 * Con NODE_ENV=production (Docker) APP_ENV es obligatorio (qa|prod)
 * para no tratar QA como PROD por error.
 */
function resolveAppEnv(): 'prod' | 'qa' | 'dev' {
  const raw = (process.env.APP_ENV ?? '').toLowerCase().trim();
  if (raw === 'prod' || raw === 'production') return 'prod';
  if (raw === 'qa' || raw === 'preview') return 'qa';
  if (raw === 'dev' || raw === 'local' || raw === 'development') return 'dev';
  if (isProd) {
    throw new Error(
      'APP_ENV must be set to "qa" or "prod" when NODE_ENV=production (Docker/Railway)',
    );
  }
  return 'dev';
}

const appEnv = resolveAppEnv();
const isProdApp = appEnv === 'prod';
/** QA o PROD desplegados (cookies cross-site, HSTS, etc.). */
const isDeployed = appEnv === 'qa' || appEnv === 'prod';

function resolveJwtSecret(): string {
  const value = process.env.JWT_SECRET;
  const weak = 'ally-flow-dev-secret-change-in-production';
  // Solo PROD de producto exige secreto fuerte (QA usa Docker con NODE_ENV=production también).
  if (isProdApp) {
    if (!value || value === weak || value.length < 32) {
      throw new Error(
        'JWT_SECRET must be set to a strong value (≥32 chars) when APP_ENV=prod',
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

  // LOCAL + QA: permitir ng serve. PROD: solo CORS_ORIGIN (front Vercel prod).
  const localDev = isProdApp
    ? []
    : ['http://localhost:4200', 'http://127.0.0.1:4200'];

  const merged = [...new Set([...fromEnv, ...localDev])];
  if (merged.length === 0) {
    return ['http://localhost:4200'];
  }
  return merged;
}

/**
 * LOCAL y QA comparten super-admin de prueba.
 * PROD: solo variables de entorno (sin defaults en código).
 */
function resolveSuperAdminDefaults(): {
  email: string;
  password: string;
  nombre: string;
} {
  if (isProdApp) {
    const email = (process.env.SUPER_ADMIN_EMAIL ?? '').trim();
    const password = process.env.SUPER_ADMIN_PASSWORD ?? '';
    const nombre = (process.env.SUPER_ADMIN_NOMBRE ?? 'SUPER ADMIN').trim();
    if (!email || !password) {
      throw new Error(
        'APP_ENV=prod requiere SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD en el entorno',
      );
    }
    return { email, password, nombre };
  }
  // QA + local
  return {
    email: 'superadmin.qa@allyflow.app',
    password: 'QaSuperAdmin#2026!',
    nombre: 'SUPER ADMIN QA',
  };
}

const superDefaults = resolveSuperAdminDefaults();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  jwtIssuer: process.env.JWT_ISSUER ?? 'ally-flow',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'ally-flow-api',
  corsOrigins: resolveCorsOrigins(),
  corsOrigin: resolveCorsOrigins()[0] ?? 'http://localhost:4200',
  nodeEnv,
  isProd,
  appEnv,
  isProdApp,
  isDeployed,
  databaseUrl: process.env.DATABASE_URL ?? '',
  databaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    process.env.DATABASE_SSL === '1' ||
    Boolean(process.env.DATABASE_URL?.includes('sslmode=require')),
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
  superAdminEmail: (process.env.SUPER_ADMIN_EMAIL ?? superDefaults.email)
    .trim()
    .toLowerCase(),
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD ?? superDefaults.password,
  superAdminNombre: (process.env.SUPER_ADMIN_NOMBRE ?? superDefaults.nombre).trim(),
} as const;
