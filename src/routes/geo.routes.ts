import { Router } from 'express';
import { searchAddress } from '../controllers/geo.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/** GET /api/geo/search?direccion=...&ciudad=Bogotá */
router.get('/search', (req, res, next) => {
  void searchAddress(req, res, next);
});

export default router;
