import { costoRepository } from '../repositories/costo.repository';

/**
 * Nombres de categoría usados al crear/filtrar casos.
 * Fuente de verdad = tarifas de Costos por empresa (sin fallback inventado).
 * Empresa nueva / sin tarifas → [] (el admin las carga en Admin).
 */
export function getCategoriasForEmpresa(empresaId: string): string[] {
  return costoRepository.listCategorias(empresaId).map((c) => c.nombre);
}
