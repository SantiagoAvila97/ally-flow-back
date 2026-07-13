import { Router } from 'express';
import { env } from '../config/env';
import { hasDatabase } from '../db/pool';
import authRoutes from './auth.routes';
import balanceRoutes from './balance.routes';
import casosRoutes from './casos.routes';
import catalogosRoutes from './catalogos.routes';
import costosRoutes from './costos.routes';
import empresasRoutes from './empresas.routes';
import geoRoutes from './geo.routes';
import usuariosRoutes from './usuarios.routes';
import { APP_VERSION } from '../version';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'ok',
    service: 'ally-flow-api',
    version: APP_VERSION,
    appEnv: env.appEnv,
    database: hasDatabase() ? 'postgres' : 'memory',
    time: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/balance', balanceRoutes);
router.use('/casos', casosRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/costos', costosRoutes);
router.use('/empresas', empresasRoutes);
router.use('/geo', geoRoutes);
router.use('/usuarios', usuariosRoutes);

export default router;
