import { Router } from 'express';
import { searchAddress } from '../controllers/geo.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireTenant } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireTenant);

/** GET /api/geo/search?direccion=...&ciudad=Bogotá */
router.get('/search', (req, res, next) => {
  void searchAddress(req, res, next);
});

export default router;
