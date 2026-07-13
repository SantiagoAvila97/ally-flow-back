import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { catalogosService } from '../services/catalogos.service';

const contactoOpt = z.string().max(160).nullable().optional();

const aseguradoraBody = z.object({
  nombre: z.string().min(2).max(120),
  nit: z.string().max(32).nullable().optional(),
  personaResponsable: contactoOpt,
  contactoCobros: contactoOpt,
  whatsapp: contactoOpt,
  activa: z.boolean().optional(),
});

const aseguradoraPatch = z.object({
  nombre: z.string().min(2).max(120).optional(),
  nit: z.string().max(32).nullable().optional(),
  personaResponsable: contactoOpt,
  contactoCobros: contactoOpt,
  whatsapp: contactoOpt,
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
      res.json({ data: catalogosService.listAseguradoras(!all) });
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
      const row = catalogosService.createAseguradora(parsed.data);
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
      const row = catalogosService.updateAseguradora(req.params.id, parsed.data);
      res.json({ data: row });
    } catch (err) {
      next(err);
    }
  }

  deleteAseguradora(req: Request, res: Response, next: NextFunction): void {
    try {
      catalogosService.deleteAseguradora(req.params.id);
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
