import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // API JSON; CSP se aplica en el front si se necesita.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );

  // Fotos/firmas dataURL caben con margen; evita bodies enormes.
  app.use(express.json({ limit: '2.5mb' }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de login. Espera unos minutos.' },
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

  app.use('/api', apiRoutes);

  app.use(errorHandler);

  return app;
}
