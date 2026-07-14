import { Router } from 'express';
import { balanceController } from '../controllers/balance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles, requireTenant } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', requireRoles('ADMIN'), (req, res, next) =>
  balanceController.resumen(req, res, next),
);

router.get('/tecnico', requireRoles('TECNICO'), (req, res, next) =>
  balanceController.resumenTecnico(req, res, next),
);

export default router;
