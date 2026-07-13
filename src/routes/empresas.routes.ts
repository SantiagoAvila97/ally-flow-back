import { Router } from 'express';
import { empresasController } from '../controllers/empresas.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles, requireTenant } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

/** Tenant: logo / datos de mi empresa */
router.get('/me', requireTenant, (req, res, next) =>
  empresasController.me(req, res, next),
);
router.patch('/me/logo', requireTenant, requireRoles('ADMIN'), (req, res, next) =>
  empresasController.updateLogo(req, res, next),
);

/** SUPER ADMIN plataforma: Suite */
router.get('/', requireRoles('SUPER_ADMIN'), (req, res, next) =>
  empresasController.list(req, res, next),
);
router.post('/', requireRoles('SUPER_ADMIN'), (req, res, next) =>
  void empresasController.create(req, res, next),
);
router.delete('/:id', requireRoles('SUPER_ADMIN'), (req, res, next) =>
  void empresasController.delete(req, res, next),
);

export default router;
