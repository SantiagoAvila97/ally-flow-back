import { Router } from 'express';
import { empresasController } from '../controllers/empresas.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles('SUPER_ADMIN'));

router.get('/', (req, res, next) => empresasController.list(req, res, next));
router.post('/', (req, res, next) => void empresasController.create(req, res, next));

export default router;
