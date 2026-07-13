import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { hasDatabase } from './db/pool';
import { errorHandler } from './middlewares/error.middleware';
import apiRoutes from './routes';
import { APP_VERSION } from './version';

export function createApp() {
  const app = express();

  // Railway / proxies: IP real para rate-limit
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // TLS termina en Railway; el header refuerza HTTPS en el browser.
      hsts: env.isDeployed
        ? { maxAge: 15_552_000, includeSubDomains: true }
        : false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalized = origin.replace(/\/$/, '');
        const allowed = env.corsOrigins.some((o) => o === normalized || o === '*');
        if (allowed) {
          // Con credentials debe devolver el origin concreto, no `*`.
          callback(null, normalized);
          return;
        }
        console.warn(`[cors] blocked origin: ${origin} (allowed: ${env.corsOrigins.join(', ')})`);
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '4mb' }));

  // Health sin rate-limit (Railway lo consulta al desplegar).
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      status: 'ok',
      service: 'ally-flow-api',
      version: APP_VERSION,
      appEnv: env.appEnv,
      database: hasDatabase() ? 'postgres' : 'memory',
      time: new Date().toISOString(),
    });
  });
  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true, status: 'ok' });
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de login. Espera unos minutos.' },
  });

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
  });

  const geoLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas búsquedas de mapa. Intenta de nuevo en un momento.' },
  });

  app.use('/api/auth/login', loginLimiter);
  app.use('/api/geo', geoLimiter);
  app.use('/api', apiLimiter);

  app.use('/api', apiRoutes);

  app.use(errorHandler);

  return app;
}
