/**
 * ============================================================================
 * Tipos — Costos (categorías + ítems de tarifa)
 * ============================================================================
 *
 * Categoría = tipo de servicio / contexto (Hogar, Apartamento, etc.)
 * Ítem = cargo concreto (Tubería de 1/4, Cambio de sifón, etc.)
 */

export interface CategoriaCosto {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCosto {
  id: string;
  empresaId: string;
  categoriaId: string;
  nombre: string;
  descripcion: string;
  /** Precio sugerido al cliente / aseguradora (COP) */
  precioSugerido: number;
  /** und | metro | ml | servicio */
  unidad: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriaConItems extends CategoriaCosto {
  items: ItemCosto[];
}

export interface CrearCategoriaInput {
  nombre: string;
  descripcion: string;
}

export interface ActualizarCategoriaInput {
  nombre?: string;
  descripcion?: string;
}

export interface CrearItemInput {
  categoriaId: string;
  nombre: string;
  descripcion: string;
  precioSugerido: number;
  unidad: string;
  activo?: boolean;
}

export interface ActualizarItemInput {
  categoriaId?: string;
  nombre?: string;
  descripcion?: string;
  precioSugerido?: number;
  unidad?: string;
  activo?: boolean;
}
