import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/** POST /api/auth/login — público */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/** GET /api/auth/me — requiere JWT */
router.get('/me', authenticate, (req, res) => authController.me(req, res));

export default router;
