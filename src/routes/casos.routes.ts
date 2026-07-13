import { Router } from 'express';
import { casosController } from '../controllers/casos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => casosController.list(req, res, next));
router.get('/meta/categorias', (req, res, next) =>
  casosController.categorias(req, res, next),
);
router.get('/meta/tecnicos', (req, res, next) =>
  casosController.tecnicos(req, res, next),
);

router.post(
  '/',
  requireRoles('ASESOR', 'ADMIN'),
  (req, res, next) => casosController.create(req, res, next),
);

router.get('/:id', (req, res, next) => casosController.getById(req, res, next));

router.patch(
  '/:id/asignar',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => casosController.asignar(req, res, next),
);

router.patch(
  '/:id/iniciar',
  requireRoles('TECNICO'),
  (req, res, next) => casosController.iniciar(req, res, next),
);

router.post(
  '/:id/fotos',
  requireRoles('TECNICO'),
  (req, res, next) => casosController.addFoto(req, res, next),
);

router.post(
  '/:id/documentar',
  requireRoles('TECNICO'),
  (req, res, next) => casosController.documentar(req, res, next),
);

router.post(
  '/:id/completar',
  requireRoles('TECNICO'),
  (req, res, next) => casosController.completar(req, res, next),
);

router.patch(
  '/:id/cobrar',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => casosController.cobrar(req, res, next),
);

router.patch(
  '/:id/lineas-cobro',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => casosController.setLineasCobro(req, res, next),
);

router.get(
  '/:id/documento-cobro.pdf',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => {
    void casosController.documentoCobroPdf(req, res, next);
  },
);

router.patch(
  '/:id/enviar-documento',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => casosController.enviarDocumento(req, res, next),
);

router.patch(
  '/:id/confirmar-asegurado',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => casosController.confirmarAsegurado(req, res, next),
);

router.post(
  '/:id/garantia',
  requireRoles('ADMIN', 'ASESOR'),
  (req, res, next) => casosController.garantia(req, res, next),
);

export default router;
