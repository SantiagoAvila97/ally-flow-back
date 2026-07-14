import type { Caso, GastoMaterial, LineaCobro } from './caso';

export function ingresoLineas(lineas: LineaCobro[] | undefined | null): number {
  if (!lineas?.length) return 0;
  return lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precioUnitario), 0);
}

export function ingresoCaso(caso: Pick<Caso, 'lineasCobro' | 'montoEstimado'>): number {
  if (caso.lineasCobro?.length) return ingresoLineas(caso.lineasCobro);
  return caso.montoEstimado ?? 0;
}

export function totalMateriales(gastos: GastoMaterial[] | undefined | null): number {
  if (!gastos?.length) return 0;
  return gastos.reduce((s, g) => s + Number(g.monto), 0);
}

export function gastoOperacionCaso(
  caso: Pick<Caso, 'pagoTecnico' | 'gastosMateriales'>,
): number {
  return (caso.pagoTecnico ?? 0) + totalMateriales(caso.gastosMateriales);
}

/** Utilidad operativa = ingreso − pago técnico − materiales (sin admin). */
export function utilidadOperativa(caso: Caso): number {
  return ingresoCaso(caso) - gastoOperacionCaso(caso);
}

/** Listo para facturar/marcar pagada: pago al técnico definido (materiales pueden ser []). */
export function gastosOperacionCompletos(
  caso: Pick<Caso, 'pagoTecnico' | 'gastosMateriales'>,
): boolean {
  return caso.pagoTecnico != null && Number.isFinite(caso.pagoTecnico) && caso.pagoTecnico >= 0;
}
