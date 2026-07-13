import { Router } from 'express';
import { balanceController } from '../controllers/balance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles, requireTenant } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireTenant, requireRoles('ADMIN'));

router.get('/', (req, res, next) => balanceController.resumen(req, res, next));

export default router;
