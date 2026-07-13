import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { CIUDADES_BOGOTA_AREA } from '../data/ciudades.seed';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import { casosService } from '../services/casos.service';
import { buildDocumentoCobroPdf } from '../services/pdf-cobro.service';

const crearSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  numeroAseguradora: z.string().min(1),
  aseguradora: z.string().min(1),
  titularNombre: z.string().min(1),
  titularTelefono: z.string().min(5),
  direccion: z.string().min(5),
  ciudad: z.enum(CIUDADES_BOGOTA_AREA as unknown as [string, ...string[]]),
  categoriaServicio: z.string().min(1),
  observaciones: z.string().optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
  direccionNormalizada: z.string().optional(),
});

const asignarSchema = z.object({
  tecnicoId: z.string().min(1),
});

const MAX_MEDIA = 2_000_000;
const mediaUrl = z
  .string()
  .min(1)
  .max(MAX_MEDIA)
  .refine(
    (v) =>
      /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(v) ||
      /^https?:\/\//i.test(v),
    { message: 'Media inválida: usa dataURL de imagen o URL http(s)' },
  );

const fotoSchema = z.object({
  url: mediaUrl,
});

const documentarSchema = z.object({
  nota: z.string().min(3).max(4000),
  fotoUrl: mediaUrl.optional(),
});

const completarSchema = z.object({
  tipoFirma: z.enum(['TECNICO', 'ATENDIDO', 'AMBAS']),
  firmaTecnicoUrl: mediaUrl.optional(),
  firmaAtendidoUrl: mediaUrl.optional(),
});

const lineasCobroSchema = z.object({
  lineas: z.array(
    z.object({
      itemCostoId: z.string().nullable().optional(),
      nombre: z.string().min(1),
      unidad: z.string().optional(),
      cantidad: z.number().positive(),
      precioUnitario: z.number().min(0),
    }),
  ),
});

export class CasosController {
  list(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.listForUser(req.user!) });
    } catch (err) {
      next(err);
    }
  }

  categorias(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.getCategorias(req.user!) });
    } catch (err) {
      next(err);
    }
  }

  tecnicos(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.listTecnicos(req.user!) });
    } catch (err) {
      next(err);
    }
  }

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.getById(req.params.id, req.user!) });
    } catch (err) {
      next(err);
    }
  }

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = crearSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Datos de caso inválidos',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }
      const caso = casosService.create(parsed.data, req.user!);
      res.status(201).json({ data: caso });
    } catch (err) {
      next(err);
    }
  }

  asignar(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = asignarSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'tecnicoId requerido' });
        return;
      }
      const caso = casosService.asignarTecnico(
        req.params.id,
        parsed.data.tecnicoId,
        req.user!,
      );
      res.json({ data: caso });
    } catch (err) {
      next(err);
    }
  }

  iniciar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.iniciarGestion(req.params.id, req.user!) });
    } catch (err) {
      next(err);
    }
  }

  addFoto(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = fotoSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'url requerida' });
        return;
      }
      const caso = casosService.addFoto(req.params.id, parsed.data.url, req.user!);
      res.status(201).json({ data: caso });
    } catch (err) {
      next(err);
    }
  }

  documentar(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = documentarSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'nota requerida (mín. 3 caracteres)' });
        return;
      }
      const caso = casosService.documentar(req.params.id, parsed.data, req.user!);
      res.json({ data: caso });
    } catch (err) {
      next(err);
    }
  }

  completar(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = completarSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Datos de cierre inválidos',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }
      const caso = casosService.completar(req.params.id, parsed.data, req.user!);
      res.json({ data: caso });
    } catch (err) {
      next(err);
    }
  }

  cobrar(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.cobrar(req.params.id, req.user!) });
    } catch (err) {
      next(err);
    }
  }

  setLineasCobro(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = lineasCobroSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Líneas inválidas',
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }
      res.json({
        data: casosService.setLineasCobro(
          req.params.id,
          parsed.data.lineas.map((l) => ({
            itemCostoId: l.itemCostoId ?? null,
            nombre: l.nombre,
            unidad: l.unidad ?? 'und',
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
          })),
          req.user!,
        ),
      });
    } catch (err) {
      next(err);
    }
  }

  enviarDocumento(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.enviarDocumento(req.params.id, req.user!) });
    } catch (err) {
      next(err);
    }
  }

  confirmarAsegurado(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.confirmarAsegurado(req.params.id, req.user!) });
    } catch (err) {
      next(err);
    }
  }

  async documentoCobroPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const caso = casosService.getById(req.params.id, req.user!);
      if (
        caso.estado !== 'PendienteDocumentoCobro' &&
        caso.estado !== 'PendienteConfirmacionAsegurado' &&
        caso.estado !== 'PendienteRecepcionPago' &&
        caso.estado !== 'Cobrado'
      ) {
        res.status(400).json({ message: 'El caso no está en etapa de cobro' });
        return;
      }
      if (!caso.lineasCobro?.length) {
        res.status(400).json({ message: 'Sin líneas de cobro para generar PDF' });
        return;
      }

      let plantilla = plantillaPdfRepository.findByEmpresa(req.user!.empresaId);
      if (!plantilla) {
        plantilla = plantillaPdfRepository.upsert(req.user!.empresaId, {
          razonSocial: req.user!.empresaNombre,
          tipoPlantilla: 'tabla_operativa',
        });
      }

      const pdf = await buildDocumentoCobroPdf(caso, plantilla);
      if (caso.estado === 'PendienteDocumentoCobro') {
        casosService.marcarDocumentoGenerado(caso.id, req.user!);
      }

      const safeName = caso.numeroAseguradora.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="cobro-${safeName || 'caso'}.pdf"`,
      );
      res.send(pdf);
    } catch (err) {
      next(err);
    }
  }

  garantia(req: Request, res: Response, next: NextFunction): void {
    try {
      res.json({ data: casosService.abrirGarantia(req.params.id, req.user!) });
    } catch (err) {
      next(err);
    }
  }
}

export const casosController = new CasosController();
