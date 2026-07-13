import { casoRepository } from '../repositories/caso.repository';
import type { BalancePeriodo, BalanceResumen } from '../types/balance';
import type { Caso, EstadoCaso, LineaCobro } from '../types/caso';
import type { PublicUser } from '../types/user';

const ESTADOS_OPERACION: EstadoCaso[] = [
  'PendienteAsignacion',
  'Asignado',
  'EnGestion',
];

/** Ya hay trabajo listo; falta armar/enviar el documento de cobro. */
const ESTADOS_ENVIAR_COBRO: EstadoCaso[] = ['PendienteDocumentoCobro'];

/** Documento listo: esperamos confirmación del asegurado o el pago. */
const ESTADOS_PENDIENTE_PAGO: EstadoCaso[] = [
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
];

function periodStart(periodo: BalancePeriodo): Date | null {
  if (periodo === 'all') return null;
  const days = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 86_400_000);
}

function inPeriod(caso: Caso, desde: Date | null): boolean {
  if (!desde) return true;
  return new Date(caso.updatedAt) >= desde;
}

function ingresoLineas(lineas: LineaCobro[]): number {
  return lineas.reduce((s, l) => s + Number(l.cantidad) * Number(l.precioUnitario), 0);
}

function ingresoCaso(caso: Caso): number {
  if (caso.lineasCobro?.length) return ingresoLineas(caso.lineasCobro);
  return caso.montoEstimado ?? 0;
}

function toFila(caso: Caso) {
  return {
    id: caso.id,
    titulo: caso.titulo,
    numeroAseguradora: caso.numeroAseguradora,
    aseguradora: caso.aseguradora,
    categoriaServicio: caso.categoriaServicio,
    estado: caso.estado,
    ingreso: ingresoCaso(caso),
    updatedAt: caso.updatedAt,
  };
}

export class BalanceService {
  getResumen(user: PublicUser, periodo: BalancePeriodo = 'all'): BalanceResumen {
    const desde = periodStart(periodo);
    const casos = casoRepository
      .findByEmpresa(user.empresaId)
      .filter((c) => inPeriod(c, desde));

    const totales = {
      pendienteEnviarCobro: 0,
      casosPendienteEnviarCobro: 0,
      pendientePago: 0,
      casosPendientePago: 0,
      ingresosCobrados: 0,
      casosCobrados: 0,
      porCobrar: 0,
      casosPorCobrar: 0,
      casosEnOperacion: 0,
      casosTotal: casos.length,
    };

    for (const c of casos) {
      const ing = ingresoCaso(c);

      if (c.estado === 'Cobrado') {
        totales.casosCobrados += 1;
        totales.ingresosCobrados += ing;
      } else if (ESTADOS_ENVIAR_COBRO.includes(c.estado)) {
        totales.casosPendienteEnviarCobro += 1;
        totales.pendienteEnviarCobro += ing;
      } else if (ESTADOS_PENDIENTE_PAGO.includes(c.estado)) {
        totales.casosPendientePago += 1;
        totales.pendientePago += ing;
      } else if (ESTADOS_OPERACION.includes(c.estado)) {
        totales.casosEnOperacion += 1;
      }
    }

    totales.porCobrar = totales.pendienteEnviarCobro + totales.pendientePago;
    totales.casosPorCobrar = totales.casosPendienteEnviarCobro + totales.casosPendientePago;

    const asegMap = new Map<string, BalanceResumen['porAseguradora'][0]>();
    for (const c of casos) {
      const nombre = c.aseguradora || 'Sin dato';
      const row = asegMap.get(nombre) ?? {
        nombre,
        casos: 0,
        ingresoCobrado: 0,
        pendienteEnviarCobro: 0,
        pendientePago: 0,
      };
      row.casos += 1;
      const ing = ingresoCaso(c);
      if (c.estado === 'Cobrado') row.ingresoCobrado += ing;
      else if (ESTADOS_ENVIAR_COBRO.includes(c.estado)) row.pendienteEnviarCobro += ing;
      else if (ESTADOS_PENDIENTE_PAGO.includes(c.estado)) row.pendientePago += ing;
      asegMap.set(nombre, row);
    }

    const porAseguradora = [...asegMap.values()].sort(
      (a, b) =>
        b.ingresoCobrado + b.pendienteEnviarCobro + b.pendientePago -
        (a.ingresoCobrado + a.pendienteEnviarCobro + a.pendientePago),
    );

    const casosPendienteEnviar = casos
      .filter((c) => ESTADOS_ENVIAR_COBRO.includes(c.estado))
      .map(toFila)
      .sort((a, b) => b.ingreso - a.ingreso);

    const casosPendientePago = casos
      .filter((c) => ESTADOS_PENDIENTE_PAGO.includes(c.estado))
      .map(toFila)
      .sort((a, b) => b.ingreso - a.ingreso);

    const cobradosRecientes = casos
      .filter((c) => c.estado === 'Cobrado')
      .map(toFila)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    return {
      periodo,
      generadoAt: new Date().toISOString(),
      totales,
      porAseguradora,
      casosPendienteEnviar,
      casosPendientePago,
      cobradosRecientes,
    };
  }
}

export const balanceService = new BalanceService();
