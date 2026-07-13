import { Router } from 'express';
import { balanceController } from '../controllers/balance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireRoles('ADMIN'));

router.get('/', (req, res, next) => balanceController.resumen(req, res, next));

export default router;
