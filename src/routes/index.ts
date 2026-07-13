import { Router } from 'express';
import authRoutes from './auth.routes';
import balanceRoutes from './balance.routes';
import casosRoutes from './casos.routes';
import costosRoutes from './costos.routes';
import geoRoutes from './geo.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/balance', balanceRoutes);
router.use('/casos', casosRoutes);
router.use('/costos', costosRoutes);
router.use('/geo', geoRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ally-flow-api' });
});

export default router;
