import { AppError } from '../middlewares/error.middleware';
import { costoRepository } from '../repositories/costo.repository';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import type {
  ActualizarCategoriaInput,
  ActualizarItemInput,
  CategoriaConItems,
  CategoriaCosto,
  CrearCategoriaInput,
  CrearItemInput,
  ItemCosto,
} from '../types/costo';
import type {
  ActualizarPlantillaPdfInput,
  PlantillaPdfCobro,
} from '../types/plantilla-pdf';
import type { PublicUser } from '../types/user';

export class CostosService {
  /**
   * Árbol completo: categorías con sus ítems (pantalla Costos).
   */
  listTree(user: PublicUser): CategoriaConItems[] {
    const cats = costoRepository.listCategorias(user.empresaId);
    return cats.map((c) => ({
      ...c,
      items: costoRepository.listItems(user.empresaId, c.id),
    }));
  }

  /** Nombres de categoría para selects de casos (cualquier rol autenticado vía casos). */
  nombresCategorias(empresaId: string): string[] {
    return costoRepository.listCategorias(empresaId).map((c) => c.nombre);
  }

  createCategoria(user: PublicUser, input: CrearCategoriaInput): CategoriaCosto {
    const nombre = input.nombre.trim();
    if (!nombre) throw new AppError(400, 'El nombre de la categoría es obligatorio');

    const dup = costoRepository
      .listCategorias(user.empresaId)
      .some((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) throw new AppError(409, 'Ya existe una categoría con ese nombre');

    const now = new Date().toISOString();
    return costoRepository.createCategoria({
      id: costoRepository.nextId('cat'),
      empresaId: user.empresaId,
      nombre,
      descripcion: (input.descripcion ?? '').trim(),
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
      const nombre = input.nombre.trim();
      if (!nombre) throw new AppError(400, 'El nombre no puede quedar vacío');
      const dup = costoRepository
        .listCategorias(user.empresaId)
        .some((c) => c.id !== id && c.nombre.toLowerCase() === nombre.toLowerCase());
      if (dup) throw new AppError(409, 'Ya existe una categoría con ese nombre');
      cat.nombre = nombre;
    }
    if (input.descripcion !== undefined) {
      cat.descripcion = input.descripcion.trim();
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

    const nombre = input.nombre.trim();
    if (!nombre) throw new AppError(400, 'El nombre del ítem es obligatorio');
    this.assertMoney(input.costoInterno, 'costoInterno');
    this.assertMoney(input.precioSugerido, 'precioSugerido');

    const now = new Date().toISOString();
    return costoRepository.createItem({
      id: costoRepository.nextId('item'),
      empresaId: user.empresaId,
      categoriaId: input.categoriaId,
      nombre,
      descripcion: (input.descripcion ?? '').trim(),
      costoInterno: input.costoInterno,
      precioSugerido: input.precioSugerido,
      unidad: (input.unidad ?? 'und').trim() || 'und',
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
      const nombre = input.nombre.trim();
      if (!nombre) throw new AppError(400, 'El nombre no puede quedar vacío');
      item.nombre = nombre;
    }
    if (input.descripcion !== undefined) item.descripcion = input.descripcion.trim();
    if (input.costoInterno !== undefined) {
      this.assertMoney(input.costoInterno, 'costoInterno');
      item.costoInterno = input.costoInterno;
    }
    if (input.precioSugerido !== undefined) {
      this.assertMoney(input.precioSugerido, 'precioSugerido');
      item.precioSugerido = input.precioSugerido;
    }
    if (input.unidad !== undefined) item.unidad = input.unidad.trim() || 'und';
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
    if (!cat || cat.empresaId !== user.empresaId) {
      throw new AppError(404, 'Categoría no encontrada');
    }
    return cat;
  }

  private requireItemOwned(user: PublicUser, id: string): ItemCosto {
    const item = costoRepository.findItem(id);
    if (!item || item.empresaId !== user.empresaId) {
      throw new AppError(404, 'Ítem no encontrado');
    }
    return item;
  }

  private assertMoney(value: number, field: string): void {
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
      throw new AppError(400, `${field} debe ser un número ≥ 0`);
    }
  }

  getPlantillaPdf(user: PublicUser): PlantillaPdfCobro {
    const existing = plantillaPdfRepository.findByEmpresa(user.empresaId);
    if (existing) return existing;
    return plantillaPdfRepository.upsert(user.empresaId, {
      razonSocial: user.empresaNombre,
      tipoPlantilla: 'tabla_operativa',
    });
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
    return plantillaPdfRepository.upsert(user.empresaId, input);
  }
}

export const costosService = new CostosService();
