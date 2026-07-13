import { Router } from 'express';
import { costosController } from '../controllers/costos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles, requireTenant } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireTenant);

/** Catálogo de tarifas: lectura para armar documento de cobro (ASESOR + ADMIN). */
router.get(
  '/',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => costosController.list(req, res, next),
);

/** Mutaciones y plantilla PDF: solo ADMIN. */
router.get(
  '/plantillas-pdf',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.listPlantillas(req, res, next),
);
router.get(
  '/plantilla-pdf',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.getPlantilla(req, res, next),
);
router.post(
  '/plantilla-pdf/preview.pdf',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.previewPlantillaPdf(req, res, next),
);
router.patch(
  '/plantilla-pdf',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.updatePlantilla(req, res, next),
);
router.delete(
  '/plantilla-pdf/:id',
  requireRoles('ADMIN'),
  (req, res, next) => costosController.deletePlantilla(req, res, next),
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
