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

  me(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json(empresasService.getMine(req.user!));
    } catch (err) {
      next(err);
    }
  }

  updateLogo(req: Request, res: Response, next: NextFunction): void {
    try {
      const logoDataUrl = String(req.body?.logoDataUrl ?? '');
      const empresa = empresasService.updateLogo(req.user!, logoDataUrl);
      res.json(empresa);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await empresasService.create({
        nombre: String(req.body?.nombre ?? ''),
        nit: String(req.body?.nit ?? ''),
        adminEmail: String(req.body?.adminEmail ?? ''),
        adminNombre: String(req.body?.adminNombre ?? ''),
        adminPassword: String(req.body?.adminPassword ?? ''),
        logoDataUrl: String(req.body?.logoDataUrl ?? ''),
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await empresasService.delete(String(req.params['id']));
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
}

export const empresasController = new EmpresasController();
