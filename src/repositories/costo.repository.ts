import { CATEGORIAS_COSTO_SEED, ITEMS_COSTO_SEED } from '../data/costos.seed';
import {
  persistCategoria,
  persistDeleteCategoria,
  persistDeleteItem,
  persistDeleteItemsByCategoria,
  persistItem,
} from '../db/persist';
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
  hydrate(categorias: CategoriaCosto[], items: ItemCosto[]): void;
}

export class InMemoryCostoRepository implements ICostoRepository {
  private categorias: CategoriaCosto[] = structuredClone(CATEGORIAS_COSTO_SEED);
  private items: ItemCosto[] = structuredClone(ITEMS_COSTO_SEED);
  private seq = 500;

  hydrate(categorias: CategoriaCosto[], items: ItemCosto[]): void {
    this.categorias = structuredClone(categorias);
    this.items = structuredClone(items);
    this.seq = Math.max(500, categorias.length + items.length + 50);
  }

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
    persistCategoria(cat);
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
    persistCategoria(this.categorias[idx]!);
    return this.categorias[idx];
  }

  deleteCategoria(id: string): boolean {
    const before = this.categorias.length;
    this.categorias = this.categorias.filter((c) => c.id !== id);
    const ok = this.categorias.length < before;
    if (ok) persistDeleteCategoria(id);
    return ok;
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
    persistItem(item);
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
    persistItem(this.items[idx]!);
    return this.items[idx];
  }

  deleteItem(id: string): boolean {
    const before = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    const ok = this.items.length < before;
    if (ok) persistDeleteItem(id);
    return ok;
  }

  deleteItemsByCategoria(categoriaId: string): number {
    const before = this.items.length;
    this.items = this.items.filter((i) => i.categoriaId !== categoriaId);
    const n = before - this.items.length;
    if (n > 0) persistDeleteItemsByCategoria(categoriaId);
    return n;
  }

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}-${Date.now().toString(36)}`;
  }

  deleteByEmpresa(empresaId: string): void {
    this.items = this.items.filter((i) => i.empresaId !== empresaId);
    this.categorias = this.categorias.filter((c) => c.empresaId !== empresaId);
  }
}

export const costoRepository = new InMemoryCostoRepository();
