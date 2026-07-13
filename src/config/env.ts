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

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:4200'),
  nodeEnv,
  isProd,
  /** Opcional: mejora el pin exacto. Sin key se usa embed de Google por búsqueda. */
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '',
} as const;
