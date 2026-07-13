import { AppError } from '../middlewares/error.middleware';
import { findEmpresaById } from '../data/empresas.seed';
import { costoRepository } from '../repositories/costo.repository';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import { catalogosService } from './catalogos.service';
import { buildDocumentoCobroPdf } from './pdf-cobro.service';
import type {
  ActualizarCategoriaInput,
  ActualizarItemInput,
  CategoriaConItems,
  CategoriaCosto,
  CrearCategoriaInput,
  CrearItemInput,
  ItemCosto,
} from '../types/costo';
import type { Caso } from '../types/caso';
import type {
  ActualizarPlantillaPdfInput,
  PlantillaPdfCobro,
} from '../types/plantilla-pdf';
import { EMPTY_PLANTILLA_EXTRAS } from '../types/plantilla-pdf';
import type { PublicUser } from '../types/user';
import { titleCaseWords } from '../utils/text';
import { requireTenantEmpresaId } from './tenant-scope';

export class CostosService {
  private eid(user: PublicUser): string {
    return requireTenantEmpresaId(user);
  }

  /**
   * Árbol completo: categorías con sus ítems (pantalla Costos).
   */
  listTree(user: PublicUser): CategoriaConItems[] {
    const cats = costoRepository.listCategorias(this.eid(user));
    return cats.map((c) => ({
      ...c,
      items: costoRepository.listItems(this.eid(user), c.id),
    }));
  }

  /** Nombres de categoría para selects de casos (cualquier rol autenticado vía casos). */
  nombresCategorias(empresaId: string): string[] {
    return costoRepository.listCategorias(empresaId).map((c) => c.nombre);
  }

  createCategoria(user: PublicUser, input: CrearCategoriaInput): CategoriaCosto {
    const nombre = titleCaseWords(input.nombre);
    if (!nombre) throw new AppError(400, 'El nombre de la categoría es obligatorio');
    const descripcion = (input.descripcion ?? '').trim();
    if (!descripcion) throw new AppError(400, 'La descripción de la categoría es obligatoria');

    const dup = costoRepository
      .listCategorias(this.eid(user))
      .some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) throw new AppError(409, 'Ya existe una categoría con ese nombre');

    const now = new Date().toISOString();
    return costoRepository.createCategoria({
      id: costoRepository.nextId('cat'),
      empresaId: this.eid(user),
      nombre,
      descripcion,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateCategoria(
    user: PublicUser,
    id: string,
    input: ActualizarCategoriaInput,
  ): CategoriaCosto {
    const cat = this.requireCategoriaOwned(user, id);

    if (input.nombre !== undefined) {
      const nombre = titleCaseWords(input.nombre);
      if (!nombre) throw new AppError(400, 'El nombre no puede quedar vacío');
      const dup = costoRepository
        .listCategorias(this.eid(user))
        .some((c) => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase());
      if (dup) throw new AppError(409, 'Ya existe una categoría con ese nombre');
      cat.nombre = nombre;
    }
    if (input.descripcion !== undefined) {
      const descripcion = input.descripcion.trim();
      if (!descripcion) throw new AppError(400, 'La descripción no puede quedar vacía');
      cat.descripcion = descripcion;
    }

    const updated = costoRepository.updateCategoria(id, {
      nombre: cat.nombre,
      descripcion: cat.descripcion,
    });
    if (!updated) throw new AppError(404, 'Categoría no encontrada');
    return updated;
  }

  deleteCategoria(user: PublicUser, id: string): void {
    this.requireCategoriaOwned(user, id);
    costoRepository.deleteItemsByCategoria(id);
    const ok = costoRepository.deleteCategoria(id);
    if (!ok) throw new AppError(404, 'Categoría no encontrada');
  }

  createItem(user: PublicUser, input: CrearItemInput): ItemCosto {
    this.requireCategoriaOwned(user, input.categoriaId);

    const nombre = titleCaseWords(input.nombre);
    if (!nombre) throw new AppError(400, 'El nombre del ítem es obligatorio');
    const descripcion = (input.descripcion ?? '').trim();
    if (!descripcion) throw new AppError(400, 'La descripción del ítem es obligatoria');
    const unidad = (input.unidad ?? '').trim();
    if (!unidad) throw new AppError(400, 'La unidad del ítem es obligatoria');
    this.assertMoney(input.costoInterno, 'costoInterno');
    this.assertMoney(input.precioSugerido, 'precioSugerido');

    const now = new Date().toISOString();
    return costoRepository.createItem({
      id: costoRepository.nextId('item'),
      empresaId: this.eid(user),
      categoriaId: input.categoriaId,
      nombre,
      descripcion,
      costoInterno: input.costoInterno,
      precioSugerido: input.precioSugerido,
      unidad,
      activo: input.activo ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateItem(user: PublicUser, id: string, input: ActualizarItemInput): ItemCosto {
    const item = this.requireItemOwned(user, id);

    if (input.categoriaId !== undefined) {
      this.requireCategoriaOwned(user, input.categoriaId);
      item.categoriaId = input.categoriaId;
    }
    if (input.nombre !== undefined) {
      const nombre = titleCaseWords(input.nombre);
      if (!nombre) throw new AppError(400, 'El nombre no puede quedar vacío');
      item.nombre = nombre;
    }
    if (input.descripcion !== undefined) {
      const descripcion = input.descripcion.trim();
      if (!descripcion) throw new AppError(400, 'La descripción no puede quedar vacía');
      item.descripcion = descripcion;
    }
    if (input.costoInterno !== undefined) {
      this.assertMoney(input.costoInterno, 'costoInterno');
      item.costoInterno = input.costoInterno;
    }
    if (input.precioSugerido !== undefined) {
      this.assertMoney(input.precioSugerido, 'precioSugerido');
      item.precioSugerido = input.precioSugerido;
    }
    if (input.unidad !== undefined) {
      const unidad = input.unidad.trim();
      if (!unidad) throw new AppError(400, 'La unidad no puede quedar vacía');
      item.unidad = unidad;
    }
    if (input.activo !== undefined) item.activo = input.activo;

    const updated = costoRepository.updateItem(id, {
      categoriaId: item.categoriaId,
      nombre: item.nombre,
      descripcion: item.descripcion,
      costoInterno: item.costoInterno,
      precioSugerido: item.precioSugerido,
      unidad: item.unidad,
      activo: item.activo,
    });
    if (!updated) throw new AppError(404, 'Ítem no encontrado');
    return updated;
  }

  deleteItem(user: PublicUser, id: string): void {
    this.requireItemOwned(user, id);
    const ok = costoRepository.deleteItem(id);
    if (!ok) throw new AppError(404, 'Ítem no encontrado');
  }

  private requireCategoriaOwned(user: PublicUser, id: string): CategoriaCosto {
    const cat = costoRepository.findCategoria(id);
    if (!cat || cat.empresaId !== this.eid(user)) {
      throw new AppError(404, 'Categoría no encontrada');
    }
    return cat;
  }

  private requireItemOwned(user: PublicUser, id: string): ItemCosto {
    const item = costoRepository.findItem(id);
    if (!item || item.empresaId !== this.eid(user)) {
      throw new AppError(404, 'Ítem no encontrado');
    }
    return item;
  }

  private assertMoney(value: number, field: string): void {
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
      throw new AppError(400, `${field} debe ser un número ≥ 0`);
    }
  }

  private ensureGeneral(user: PublicUser): PlantillaPdfCobro {
    const existing = plantillaPdfRepository.findDefault(this.eid(user));
    if (existing) return existing;
    return plantillaPdfRepository.upsert(this.eid(user), null, {
      razonSocial: user.empresaNombre ?? 'Empresa',
      tipoPlantilla: 'tabla_operativa',
      textoHeader: 'Factura para cobro',
    });
  }

  /**
   * Cabecera siempre de la general. Si hay aseguradoraId, mezcla extras del override
   * (o extras vacíos si aún no existe).
   */
  getPlantillaPdf(user: PublicUser, aseguradoraId?: string | null): PlantillaPdfCobro {
    const general = this.ensureGeneral(user);
    if (!aseguradoraId) return general;

    const override = plantillaPdfRepository.findByAseguradora(this.eid(user), aseguradoraId);
    return {
      ...general,
      id: override?.id ?? '',
      aseguradoraId,
      extras: override?.extras ?? { ...EMPTY_PLANTILLA_EXTRAS },
      updatedAt: override?.updatedAt ?? general.updatedAt,
    };
  }

  listPlantillasPdf(user: PublicUser): PlantillaPdfCobro[] {
    this.ensureGeneral(user);
    return plantillaPdfRepository.listByEmpresa(this.eid(user));
  }

  updatePlantillaPdf(
    user: PublicUser,
    input: ActualizarPlantillaPdfInput,
  ): PlantillaPdfCobro {
    if (input.tipoPlantilla && !['tabla_operativa', 'carta_siniestro'].includes(input.tipoPlantilla)) {
      throw new AppError(400, 'Tipo de plantilla inválido');
    }
    if (input.colorAcento && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(input.colorAcento)) {
      throw new AppError(400, 'colorAcento debe ser hex (#RGB o #RRGGBB)');
    }

    const aseguradoraId =
      input.aseguradoraId === undefined ? null : input.aseguradoraId;

    if (aseguradoraId) {
      const aseg = catalogosService.listAseguradoras(user, false).find((a) => a.id === aseguradoraId);
      if (!aseg) throw new AppError(400, 'Cliente no válido');

      // Cabecera unificada: branding solo en general; aquí solo extras.
      const extras = {
        ...EMPTY_PLANTILLA_EXTRAS,
        ...(input.extras ?? {}),
      };
      plantillaPdfRepository.upsert(this.eid(user), aseguradoraId, { extras });

      // Si también mandan branding, actualizar la general (misma cabecera para todos).
      const hasBranding =
        input.razonSocial !== undefined ||
        input.nit !== undefined ||
        input.ciudad !== undefined ||
        input.telefono !== undefined ||
        input.email !== undefined ||
        input.colorAcento !== undefined ||
        input.textoHeader !== undefined ||
        input.textoFooter !== undefined ||
        input.tipoPlantilla !== undefined;
      if (hasBranding) {
        const { aseguradoraId: _a, extras: _e, ...branding } = input;
        plantillaPdfRepository.upsert(this.eid(user), null, branding);
      }

      return this.getPlantillaPdf(user, aseguradoraId);
    }

    const { aseguradoraId: _a, extras: _e, ...branding } = input;
    plantillaPdfRepository.upsert(this.eid(user), null, branding);
    return this.getPlantillaPdf(user, null);
  }

  deletePlantillaPdf(user: PublicUser, id: string): void {
    const row = plantillaPdfRepository.findById(id);
    if (!row || row.empresaId !== this.eid(user)) {
      throw new AppError(404, 'Plantilla no encontrada');
    }
    if (row.aseguradoraId === null) {
      throw new AppError(400, 'No se puede eliminar la plantilla general');
    }
    if (!plantillaPdfRepository.deleteOverride(id)) {
      throw new AppError(404, 'Plantilla no encontrada');
    }
  }

  /** Cabecera general + extras del cliente del caso (si existen). */
  resolvePlantillaForCaso(user: PublicUser, aseguradoraNombre: string): PlantillaPdfCobro {
    const aseg = catalogosService
      .listAseguradoras(user, false)
      .find((a) => a.nombre.toLowerCase() === aseguradoraNombre.trim().toLowerCase());
    if (aseg) return this.getPlantillaPdf(user, aseg.id);
    return this.getPlantillaPdf(user, null);
  }

  /**
   * PDF de prueba: usa el borrador del form (sin guardar) + caso demo.
   */
  async buildPreviewDocumentoCobroPdf(
    user: PublicUser,
    draft: ActualizarPlantillaPdfInput,
  ): Promise<Buffer> {
    const asegId = draft.aseguradoraId ?? null;
    const base = this.getPlantillaPdf(user, asegId);
    const plantilla: PlantillaPdfCobro = {
      ...base,
      razonSocial: draft.razonSocial ?? base.razonSocial,
      nit: draft.nit ?? base.nit,
      ciudad: draft.ciudad ?? base.ciudad,
      telefono: draft.telefono ?? base.telefono,
      email: draft.email ?? base.email,
      colorAcento: draft.colorAcento ?? base.colorAcento,
      textoHeader: draft.textoHeader ?? base.textoHeader,
      textoFooter: draft.textoFooter ?? base.textoFooter,
      tipoPlantilla: draft.tipoPlantilla ?? base.tipoPlantilla,
      extras: draft.extras
        ? { ...EMPTY_PLANTILLA_EXTRAS, ...base.extras, ...draft.extras }
        : base.extras,
      aseguradoraId: asegId,
    };

    if (plantilla.colorAcento && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(plantilla.colorAcento)) {
      throw new AppError(400, 'colorAcento debe ser hex (#RGB o #RRGGBB)');
    }
    if (
      plantilla.tipoPlantilla &&
      !['tabla_operativa', 'carta_siniestro'].includes(plantilla.tipoPlantilla)
    ) {
      throw new AppError(400, 'Tipo de plantilla inválido');
    }

    let aseguradoraNombre = 'Cliente de ejemplo';
    if (asegId) {
      const aseg = catalogosService.listAseguradoras(user, false).find((a) => a.id === asegId);
      if (aseg) aseguradoraNombre = aseg.nombre;
    }

    return buildDocumentoCobroPdf(buildCasoDemoPreview(user, aseguradoraNombre), plantilla, {
      logoDataUrl: findEmpresaById(requireTenantEmpresaId(user))?.logoDataUrl ?? null,
    });
  }
}

function buildCasoDemoPreview(user: PublicUser, aseguradoraNombre: string): Caso {
  const now = new Date().toISOString();
  return {
    id: 'preview-demo',
    titulo: 'Inspección demo — vista previa',
    descripcion: 'Caso ficticio para previsualizar la factura de cobro.',
    cliente: aseguradoraNombre,
    estado: 'PendienteDocumentoCobro',
    empresaId: requireTenantEmpresaId(user),
    asesorId: user.id,
    tecnicoId: null,
    numeroAseguradora: 'PREV-001',
    aseguradora: aseguradoraNombre,
    titularNombre: 'Cliente de ejemplo',
    titularTelefono: '+57 300 000 0000',
    direccion: 'Calle 100 #19-50',
    ciudad: 'Bogotá',
    lat: null,
    lon: null,
    direccionNormalizada: null,
    categoriaServicio: 'Plomería',
    observaciones: '',
    fotos: [],
    firmaAtendidoUrl: null,
    firmaTecnicoUrl: null,
    gestionadoAt: null,
    esGarantia: false,
    casoOrigenId: null,
    montoEstimado: 300000,
    lineasCobro: [
      {
        itemCostoId: null,
        nombre: 'Visita técnica',
        unidad: 'und',
        cantidad: 1,
        precioUnitario: 120000,
      },
      {
        itemCostoId: null,
        nombre: 'Destape de desagüe',
        unidad: 'und',
        cantidad: 1,
        precioUnitario: 180000,
      },
    ],
    documentoCobroGeneradoAt: null,
    historialCambios: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const costosService = new CostosService();