import { Router } from 'express';
import { catalogosController } from '../controllers/catalogos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles, requireTenant } from '../middlewares/role.middleware';

/**
 * Catálogos de referencia.
 * Lectura: usuarios de tenant autenticados.
 * Mutaciones: solo ADMIN. Clientes (catálogo) son por empresa, como tarifas.
 */
const router = Router();

router.use(authenticate, requireTenant);

router.get('/', (req, res, next) => catalogosController.getAll(req, res, next));

router.get('/aseguradoras', (req, res, next) =>
  catalogosController.listAseguradoras(req, res, next),
);
router.post(
  '/aseguradoras',
  requireRoles('ADMIN'),
  (req, res, next) => catalogosController.createAseguradora(req, res, next),
);
router.patch(
  '/aseguradoras/:id',
  requireRoles('ADMIN'),
  (req, res, next) => catalogosController.updateAseguradora(req, res, next),
);
router.delete(
  '/aseguradoras/:id',
  requireRoles('ADMIN'),
  (req, res, next) => catalogosController.deleteAseguradora(req, res, next),
);

router.get('/ciudades', (req, res, next) => catalogosController.listCiudades(req, res, next));

export default router;
