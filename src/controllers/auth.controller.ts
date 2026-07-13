import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { clearAuthCookie, setAuthCookie } from '../utils/auth-cookie';
import { getLoginPublicKeyPem } from '../utils/auth-crypto';
import { decryptLoginEnvelope } from '../utils/login-envelope';

/** Login cifrado: Network no muestra email/password en claro. */
const loginEncryptedSchema = z.object({
  ek: z.string().min(1),
  iv: z.string().min(1),
  ct: z.string().min(1),
});

export class AuthController {
  publicKey(_req: Request, res: Response): void {
    res.json({
      alg: 'RSA-OAEP-256',
      publicKey: getLoginPublicKeyPem(),
    });
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginEncryptedSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message:
            'Login requiere payload cifrado (ek, iv, ct). Actualiza el cliente.',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { email, password } = decryptLoginEnvelope(parsed.data);

      const result = await authService.login(email, password);

      setAuthCookie(res, result.token);
      res.json({ user: result.user });
    } catch (err) {
      next(err);
    }
  }

  logout(_req: Request, res: Response): void {
    clearAuthCookie(res);
    res.json({ ok: true });
  }

  me(req: Request, res: Response): void {
    res.json({ user: req.user });
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = z
        .object({
          currentPassword: z.string().min(1),
          newPassword: z.string().min(8),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos' });
        return;
      }
      await authService.changePassword(
        req.user!.id,
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
