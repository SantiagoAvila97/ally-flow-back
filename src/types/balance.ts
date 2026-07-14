import type { EstadoCaso } from './caso';

/** `month` = mes calendario en curso; `7d`/`30d`/`90d` = rolling; `all` = sin filtro. */
export type BalancePeriodo = '7d' | '30d' | '90d' | 'month' | 'all';

export interface BalanceTotales {
  /** PendienteDocumentoCobro: falta armar / enviar el PDF de cobro */
  pendienteEnviarCobro: number;
  casosPendienteEnviarCobro: number;
  /** Confirmación + recepción: ya hay documento, esperamos que nos paguen */
  pendientePago: number;
  casosPendientePago: number;
  /** Ya marcados Cobrado = la aseguradora/cliente pagó (no es pago al técnico). */
  ingresosCobrados: number;
  casosCobrados: number;
  /** Suma de los dos pendientes (enviar + pago) */
  porCobrar: number;
  casosPorCobrar: number;
  /** Casos aún en campo / asignación */
  casosEnOperacion: number;
  casosTotal: number;

  /**
   * Pago a técnicos: casos Pagados (cliente) con liquidación definida.
   */
  pagoTecnicos: number;
  /** Materiales (misma base: Pagados con liquidación). */
  materiales: number;
  /**
   * Utilidad = ingreso cobrado − técnico − materiales (solo Pagadas liquidas).
   */
  utilidadOperativa: number;
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

export interface BalanceOpsCasoFila {
  id: string;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  tecnicoId: string | null;
  tecnicoNombre: string | null;
  estado: EstadoCaso;
  ingreso: number;
  pagoTecnico: number | null;
  materiales: number;
  utilidad: number | null;
  updatedAt: string;
}

export interface BalancePorTecnico {
  tecnicoId: string;
  tecnicoNombre: string;
  casos: number;
  aPagar: number;
  pendientesLiquidar: number;
}

export interface BalanceResumen {
  periodo: BalancePeriodo;
  generadoAt: string;
  totales: BalanceTotales;
  porAseguradora: BalancePorDimension[];
  casosPendienteEnviar: BalanceCasoFila[];
  casosPendientePago: BalanceCasoFila[];
  cobradosRecientes: BalanceCasoFila[];
  /** Detalle operativo: ingreso vs gastos. */
  casosOperacion: BalanceOpsCasoFila[];
  porTecnico: BalancePorTecnico[];
}

export interface BalanceTecnicoCasoFila {
  id: string;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  estado: EstadoCaso;
  cerradoEn: string | null;
  pagoTecnico: number | null;
  updatedAt: string;
}

export interface BalanceTecnicoResumen {
  periodo: BalancePeriodo;
  generadoAt: string;
  totales: {
    aPagar: number;
    casosConPago: number;
    casosPendientes: number;
    casos: number;
  };
  casos: BalanceTecnicoCasoFila[];
}
