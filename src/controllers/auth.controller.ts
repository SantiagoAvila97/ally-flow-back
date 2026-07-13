import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Datos de login inválidos',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const result = await authService.login(parsed.data.email, parsed.data.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /** Endpoint útil para el frontend: valida token y devuelve el usuario actual. */
  me(req: Request, res: Response): void {
    res.json({ user: req.user });
  }
}

export const authController = new AuthController();
