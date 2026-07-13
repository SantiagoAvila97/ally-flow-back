import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { costosService } from '../services/costos.service';

const categoriaSchema = z.object({
  nombre: z.string().trim().min(1),
  descripcion: z.string().trim().min(1),
});

const categoriaPatchSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().trim().min(1).optional(),
});

const itemSchema = z.object({
  categoriaId: z.string().min(1),
  nombre: z.string().trim().min(1),
  descripcion: z.string().trim().min(1),
  costoInterno: z.number().min(0),
  precioSugerido: z.number().min(0),
  unidad: z.string().trim().min(1),
  activo: z.boolean().optional(),
});

const itemPatchSchema = z.object({
  categoriaId: z.string().min(1).optional(),
  nombre: z.string().trim().min(1).optional(),
  descripcion: z.string().trim().min(1).optional(),
  costoInterno: z.number().min(0).optional(),
  precioSugerido: z.number().min(0).optional(),
  unidad: z.string().trim().min(1).optional(),
  activo: z.boolean().optional(),
});

const plantillaPatchSchema = z.object({
  aseguradoraId: z.string().min(1).nullable().optional(),
  razonSocial: z.string().trim().min(1),
  nit: z.string().trim().min(1),
  ciudad: z.string().trim().min(1),
  telefono: z.string().trim().min(1),
  email: z.string().trim().min(1),
  colorAcento: z.string().trim().min(1),
  textoHeader: z.string().trim().min(1),
  textoFooter: z.string().trim().min(1),
  tipoPlantilla: z.enum(['tabla_operativa', 'carta_siniestro']).optional(),
  extras: z
    .object({
      destinatario: z.string().optional(),
      codigoProveedor: z.string().optional(),
      notaAdicional: z.string().optional(),
    })
    .optional(),
});

export class CostosController {
  list(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: costosService.listTree(req.user!) });
    } catch (err) {
      next(err);
    }
  }

  createCategoria(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = categoriaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      const data = costosService.createCategoria(req.user!, parsed.data);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  updateCategoria(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = categoriaPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      const data = costosService.updateCategoria(req.user!, req.params['id']!, parsed.data);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  deleteCategoria(req: Request, res: Response, next: NextFunction): void {
    try {
      costosService.deleteCategoria(req.user!, req.params['id']!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  createItem(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = itemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      const data = costosService.createItem(req.user!, parsed.data);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }

  updateItem(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = itemPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      const data = costosService.updateItem(req.user!, req.params['id']!, parsed.data);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }

  deleteItem(req: Request, res: Response, next: NextFunction): void {
    try {
      costosService.deleteItem(req.user!, req.params['id']!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  listPlantillas(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: costosService.listPlantillasPdf(req.user!) });
    } catch (err) {
      next(err);
    }
  }

  getPlantilla(req: Request, res: Response, next: NextFunction): void {
    try {
      const raw = req.query.aseguradoraId;
      const aseguradoraId =
        typeof raw === 'string' && raw.length > 0 ? raw : null;
      res.json({ data: costosService.getPlantillaPdf(req.user!, aseguradoraId) });
    } catch (err) {
      next(err);
    }
  }

  updatePlantilla(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = plantillaPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      res.json({ data: costosService.updatePlantillaPdf(req.user!, parsed.data) });
    } catch (err) {
      next(err);
    }
  }

  deletePlantilla(req: Request, res: Response, next: NextFunction): void {
    try {
      costosService.deletePlantillaPdf(req.user!, req.params['id']!);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async previewPlantillaPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = plantillaPatchSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ message: 'Datos inválidos', errors: parsed.error.flatten() });
        return;
      }
      const pdf = await costosService.buildPreviewDocumentoCobroPdf(req.user!, parsed.data);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="factura-cobro-prueba.pdf"',
      );
      res.send(pdf);
    } catch (err) {
      next(err);
    }
  }
}

export const costosController = new CostosController();
