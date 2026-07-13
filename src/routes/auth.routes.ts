import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/** GET /api/auth/public-key — PEM para cifrar login */
router.get('/public-key', (req, res) => authController.publicKey(req, res));

/** POST /api/auth/login — body cifrado { ek, iv, ct }; setea cookie httpOnly */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/** POST /api/auth/logout — limpia cookie (público) */
router.post('/logout', (req, res) => authController.logout(req, res));

/** GET /api/auth/me — requiere JWT (cookie o Bearer) */
router.get('/me', authenticate, (req, res) => authController.me(req, res));

/** POST /api/auth/change-password — usuario autenticado */
router.post('/change-password', authenticate, (req, res, next) =>
  authController.changePassword(req, res, next),
);

export default router;
