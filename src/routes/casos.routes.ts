import { Router } from 'express';
import { casosController } from '../controllers/casos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRoles, requireTenant } from '../middlewares/role.middleware';
import { CASO_ACTION_ROLES } from '../types/caso-permissions';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', (req, res, next) => casosController.list(req, res, next));
router.get(
  '/meta/categorias',
  requireRoles('ADMIN', 'ASESOR', 'TECNICO'),
  (req, res, next) => casosController.categorias(req, res, next),
);
router.get(
  '/meta/tecnicos',
  requireRoles(...CASO_ACTION_ROLES.asignar),
  (req, res, next) => casosController.tecnicos(req, res, next),
);

router.post(
  '/',
  requireRoles(...CASO_ACTION_ROLES.crear),
  (req, res, next) => casosController.create(req, res, next),
);

router.get('/:id', (req, res, next) => casosController.getById(req, res, next));

router.patch(
  '/:id/asignar',
  requireRoles(...CASO_ACTION_ROLES.asignar),
  (req, res, next) => casosController.asignar(req, res, next),
);

router.patch(
  '/:id/iniciar',
  requireRoles(...CASO_ACTION_ROLES.iniciar),
  (req, res, next) => casosController.iniciar(req, res, next),
);

router.post(
  '/:id/fotos',
  requireRoles(...CASO_ACTION_ROLES.fotos),
  (req, res, next) => casosController.addFoto(req, res, next),
);

router.post(
  '/:id/documentar',
  requireRoles(...CASO_ACTION_ROLES.documentar),
  (req, res, next) => casosController.documentar(req, res, next),
);

router.post(
  '/:id/completar',
  requireRoles(...CASO_ACTION_ROLES.completar),
  (req, res, next) => casosController.completar(req, res, next),
);

router.patch(
  '/:id/lineas-cobro',
  requireRoles(...CASO_ACTION_ROLES.lineas_cobro),
  (req, res, next) => casosController.setLineasCobro(req, res, next),
);

router.patch(
  '/:id/gastos-operacion',
  requireRoles(...CASO_ACTION_ROLES.gastos_operacion),
  (req, res, next) => casosController.setGastosOperacion(req, res, next),
);

router.post(
  '/:id/gastos-materiales',
  requireRoles(...CASO_ACTION_ROLES.materiales_adjuntar),
  (req, res, next) => casosController.adjuntarMateriales(req, res, next),
);

router.get(
  '/:id/documento-cobro.pdf',
  requireRoles(...CASO_ACTION_ROLES.lineas_cobro),
  (req, res, next) => {
    void casosController.documentoCobroPdf(req, res, next);
  },
);

router.patch(
  '/:id/enviar-documento',
  requireRoles(...CASO_ACTION_ROLES.enviar_documento),
  (req, res, next) => casosController.enviarDocumento(req, res, next),
);

router.patch(
  '/:id/confirmar-asegurado',
  requireRoles(...CASO_ACTION_ROLES.confirmar_asegurado),
  (req, res, next) => casosController.confirmarAsegurado(req, res, next),
);

router.patch(
  '/:id/cobrar',
  requireRoles(...CASO_ACTION_ROLES.cobrar),
  (req, res, next) => casosController.cobrar(req, res, next),
);

router.post(
  '/:id/garantia',
  requireRoles(...CASO_ACTION_ROLES.garantia),
  (req, res, next) => casosController.garantia(req, res, next),
);

export default router;
