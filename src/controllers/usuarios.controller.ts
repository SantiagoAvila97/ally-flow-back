import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { usuariosService } from '../services/usuarios.service';

const createSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'ASESOR', 'TECNICO']),
  empresaId: z.string().optional().nullable(),
});

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'ASESOR', 'TECNICO']).optional(),
  activo: z.boolean().optional(),
});

const resetSchema = z.object({
  newPassword: z.string().min(8),
});

export class UsuariosController {
  rolesInfo(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(usuariosService.rolesInfo());
    } catch (err) {
      next(err);
    }
  }

  list(req: Request, res: Response, next: NextFunction): void {
    try {
      const empresaId =
        typeof req.query.empresaId === 'string' ? req.query.empresaId : undefined;
      const rows = usuariosService.list(req.user!, empresaId);
      res.json(
        rows.map((u) => ({
          ...u,
          canEdit: usuariosService.canEdit(req.user!, u),
        })),
      );
    } catch (err) {
      next(err);
    }
  }

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      const result = usuariosService.create(req.user!, parsed.data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos' });
        return;
      }
      const user = usuariosService.update(req.user!, String(req.params['id']), parsed.data);
      res.json({
        ...user,
        canEdit: usuariosService.canEdit(req.user!, user),
      });
    } catch (err) {
      next(err);
    }
  }

  resetPassword(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = resetSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Contraseña inválida' });
        return;
      }
      const result = usuariosService.resetPassword(
        req.user!,
        String(req.params['id']),
        parsed.data.newPassword,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const usuariosController = new UsuariosController();
