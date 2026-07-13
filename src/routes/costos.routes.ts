import { Router } from 'express';
import { costosController } from '../controllers/costos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

/** Catálogo de tarifas: lectura para armar documento de cobro (ASESOR + ADMIN). */
router.get(
  '/',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => costosController.list(req, res, next),
);

/** Mutaciones y plantilla PDF: solo ADMIN. */
router.get(
  '/plantilla-pdf',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.getPlantilla(req, res, next),
);
router.patch(
  '/plantilla-pdf',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.updatePlantilla(req, res, next),
);

router.post(
  '/categorias',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.createCategoria(req, res, next),
);
router.patch(
  '/categorias/:id',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.updateCategoria(req, res, next),
);
router.delete(
  '/categorias/:id',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.deleteCategoria(req, res, next),
);

router.post(
  '/items',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.createItem(req, res, next),
);
router.patch(
  '/items/:id',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.updateItem(req, res, next),
);
router.delete(
  '/items/:id',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.deleteItem(req, res, next),
);

export default router;
