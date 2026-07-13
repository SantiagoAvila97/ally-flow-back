import { CATEGORIAS_COSTO_SEED, ITEMS_COSTO_SEED } from '../data/costos.seed';
import type { CategoriaCosto, ItemCosto } from '../types/costo';

export interface ICostoRepository {
  listCategorias(empresaId: string): CategoriaCosto[];
  findCategoria(id: string): CategoriaCosto | undefined;
  createCategoria(cat: CategoriaCosto): CategoriaCosto;
  updateCategoria(id: string, patch: Partial<CategoriaCosto>): CategoriaCosto | undefined;
  deleteCategoria(id: string): boolean;

  listItems(empresaId: string, categoriaId?: string): ItemCosto[];
  findItem(id: string): ItemCosto | undefined;
  createItem(item: ItemCosto): ItemCosto;
  updateItem(id: string, patch: Partial<ItemCosto>): ItemCosto | undefined;
  deleteItem(id: string): boolean;
  deleteItemsByCategoria(categoriaId: string): number;

  nextId(prefix: string): string;
}

export class InMemoryCostoRepository implements ICostoRepository {
  private categorias: CategoriaCosto[] = structuredClone(CATEGORIAS_COSTO_SEED);
  private items: ItemCosto[] = structuredClone(ITEMS_COSTO_SEED);
  private seq = 500;

  listCategorias(empresaId: string): CategoriaCosto[] {
    return this.categorias
      .filter((c) => c.empresaId === empresaId)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  findCategoria(id: string): CategoriaCosto | undefined {
    return this.categorias.find((c) => c.id === id);
  }

  createCategoria(cat: CategoriaCosto): CategoriaCosto {
    this.categorias.push(cat);
    return cat;
  }

  updateCategoria(id: string, patch: Partial<CategoriaCosto>): CategoriaCosto | undefined {
    const idx = this.categorias.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.categorias[idx] = {
      ...this.categorias[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.categorias[idx];
  }

  deleteCategoria(id: string): boolean {
    const before = this.categorias.length;
    this.categorias = this.categorias.filter((c) => c.id !== id);
    return this.categorias.length < before;
  }

  listItems(empresaId: string, categoriaId?: string): ItemCosto[] {
    return this.items
      .filter((i) => i.empresaId === empresaId)
      .filter((i) => (categoriaId ? i.categoriaId === categoriaId : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  findItem(id: string): ItemCosto | undefined {
    return this.items.find((i) => i.id === id);
  }

  createItem(item: ItemCosto): ItemCosto {
    this.items.push(item);
    return item;
  }

  updateItem(id: string, patch: Partial<ItemCosto>): ItemCosto | undefined {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.items[idx] = {
      ...this.items[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.items[idx];
  }

  deleteItem(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return this.items.length < before;
  }

  deleteItemsByCategoria(categoriaId: string): number {
    const before = this.items.length;
    this.items = this.items.filter((i) => i.categoriaId !== categoriaId);
    return before - this.items.length;
  }

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}-${Date.now().toString(36)}`;
  }
}

export const costoRepository = new InMemoryCostoRepository();
