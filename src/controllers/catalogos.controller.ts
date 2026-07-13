import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { catalogosService } from '../services/catalogos.service';

const contactoReq = z.string().trim().min(1).max(160);

const aseguradoraBody = z.object({
  nombre: z.string().trim().min(2).max(120),
  nit: z.string().trim().min(1).max(32),
  personaResponsable: contactoReq,
  contactoCobros: contactoReq,
  whatsapp: contactoReq,
  activa: z.boolean().optional(),
});

const aseguradoraPatch = z.object({
  nombre: z.string().trim().min(2).max(120).optional(),
  nit: z.string().trim().min(1).max(32).optional(),
  personaResponsable: contactoReq.optional(),
  contactoCobros: contactoReq.optional(),
  whatsapp: contactoReq.optional(),
  activa: z.boolean().optional(),
});

export class CatalogosController {
  /** GET /api/catalogos — payload unificado para formularios. */
  getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: catalogosService.getAll(req.user!) });
    } catch (err) {
      next(err);
    }
  }

  listAseguradoras(req: Request, res: Response, next: NextFunction): void {
    try {
      const all = req.query.all === '1' || req.query.all === 'true';
      res.json({ data: catalogosService.listAseguradoras(req.user!, !all) });
    } catch (err) {
      next(err);
    }
  }

  createAseguradora(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = aseguradoraBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
        return;
      }
      const row = catalogosService.createAseguradora(req.user!, parsed.data);
      res.status(201).json({ data: row });
    } catch (err) {
      next(err);
    }
  }

  updateAseguradora(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = aseguradoraPatch.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', issues: parsed.error.issues });
        return;
      }
      const row = catalogosService.updateAseguradora(req.user!, req.params.id, parsed.data);
      res.json({ data: row });
    } catch (err) {
      next(err);
    }
  }

  deleteAseguradora(req: Request, res: Response, next: NextFunction): void {
    try {
      catalogosService.deleteAseguradora(req.user!, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  listCiudades(req: Request, res: Response, next: NextFunction): void {
    try {
      const all = req.query.all === '1' || req.query.all === 'true';
      res.json({ data: catalogosService.listCiudades(!all) });
    } catch (err) {
      next(err);
    }
  }
}

export const catalogosController = new CatalogosController();
