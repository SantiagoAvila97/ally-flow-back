import type { NextFunction, Request, Response } from 'express';
import { empresasService } from '../services/empresas.service';

export class EmpresasController {
  list(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(empresasService.list());
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await empresasService.create({
        nombre: String(req.body?.nombre ?? ''),
        slug: req.body?.slug ? String(req.body.slug) : undefined,
        adminEmail: String(req.body?.adminEmail ?? ''),
        adminNombre: String(req.body?.adminNombre ?? ''),
        adminPassword: String(req.body?.adminPassword ?? ''),
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const empresasController = new EmpresasController();
