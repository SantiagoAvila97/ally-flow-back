import { costoRepository } from '../repositories/costo.repository';

/**
 * Compat: nombres de categoría usados al crear/validar casos.
 * Fuente de verdad = catálogo de Costos (por empresa).
 */
export function getCategoriasForEmpresa(empresaId: string): string[] {
  const nombres = costoRepository.listCategorias(empresaId).map((c) => c.nombre);
  return nombres.length > 0
    ? nombres
    : ['Hogar', 'Apartamento', 'Oficina', 'Local comercial', 'Glass'];
}
