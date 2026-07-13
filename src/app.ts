import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  // Railway / proxies: IP real para rate-limit
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // TLS termina en Railway; el header refuerza HTTPS en el browser.
      hsts: env.isProd || env.appEnv === 'prod' || env.appEnv === 'qa'
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
          callback(null, true);
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

  app.use(express.json({ limit: '2.5mb' }));

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
