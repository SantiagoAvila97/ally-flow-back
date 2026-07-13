import { Router } from 'express';
import { usuariosController } from '../controllers/usuarios.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireRoles('SUPER_ADMIN', 'ADMIN'));

router.get('/roles-info', (req, res, next) =>
  usuariosController.rolesInfo(req, res, next),
);

router.get('/', (req, res, next) => usuariosController.list(req, res, next));

router.post('/', (req, res, next) => usuariosController.create(req, res, next));

router.patch('/:id', (req, res, next) => usuariosController.update(req, res, next));

router.post('/:id/reset-password', (req, res, next) =>
  usuariosController.resetPassword(req, res, next),
);

export default router;
