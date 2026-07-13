import type { EstadoCaso } from './caso';

export type BalancePeriodo = '7d' | '30d' | '90d' | 'all';

export interface BalanceTotales {
  /** PendienteDocumentoCobro: falta armar / enviar el PDF de cobro */
  pendienteEnviarCobro: number;
  casosPendienteEnviarCobro: number;
  /** Confirmación + recepción: ya hay documento, esperamos que nos paguen */
  pendientePago: number;
  casosPendientePago: number;
  /** Ya marcados como cobrados */
  ingresosCobrados: number;
  casosCobrados: number;
  /** Suma de los dos pendientes (enviar + pago) */
  porCobrar: number;
  casosPorCobrar: number;
  /** Casos aún en campo / asignación */
  casosEnOperacion: number;
  casosTotal: number;
}

export interface BalancePorDimension {
  nombre: string;
  casos: number;
  ingresoCobrado: number;
  pendienteEnviarCobro: number;
  pendientePago: number;
}

export interface BalanceCasoFila {
  id: string;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  categoriaServicio: string;
  estado: EstadoCaso;
  ingreso: number;
  updatedAt: string;
}

export interface BalanceResumen {
  periodo: BalancePeriodo;
  generadoAt: string;
  totales: BalanceTotales;
  porAseguradora: BalancePorDimension[];
  casosPendienteEnviar: BalanceCasoFila[];
  casosPendientePago: BalanceCasoFila[];
  cobradosRecientes: BalanceCasoFila[];
}
