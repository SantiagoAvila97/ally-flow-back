import { findUserById } from '../data/users.seed';
import { casoRepository } from '../repositories/caso.repository';
import type {
  BalancePeriodo,
  BalanceRango,
  BalanceResumen,
  BalanceTecnicoResumen,
} from '../types/balance';
import type { Caso, EstadoCaso } from '../types/caso';
import {
  ingresoCaso,
  totalMateriales,
  utilidadOperativa,
} from '../types/caso-money';
import { AppError } from '../middlewares/error.middleware';
import type { PublicUser } from '../types/user';
import { requireTenantEmpresaId } from './tenant-scope';

const ESTADOS_OPERACION: EstadoCaso[] = [
  'PendienteAsignacion',
  'Asignado',
  'EnGestion',
];

const ESTADOS_ENVIAR_COBRO: EstadoCaso[] = ['PendienteDocumentoCobro'];

const ESTADOS_PENDIENTE_PAGO: EstadoCaso[] = [
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
];

function parseDayStart(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
}

function parseDayEnd(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
}

/** Inicio del periodo preset (inclusive), o null = sin filtro inferior. */
function periodStart(periodo: BalancePeriodo): Date | null {
  if (periodo === 'all' || periodo === 'custom') return null;
  if (periodo === 'month') {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  const days = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 86_400_000);
}

function resolveRange(rango: BalanceRango): { desde: Date | null; hasta: Date | null } {
  const desdeCustom = rango.desde ? parseDayStart(rango.desde) : null;
  const hastaCustom = rango.hasta ? parseDayEnd(rango.hasta) : null;
  if (desdeCustom || hastaCustom || rango.periodo === 'custom') {
    return { desde: desdeCustom, hasta: hastaCustom };
  }
  return { desde: periodStart(rango.periodo), hasta: null };
}

function fechaReferencia(caso: Caso): Date {
  return new Date(caso.updatedAt);
}

function inRange(caso: Caso, desde: Date | null, hasta: Date | null): boolean {
  const ref = fechaReferencia(caso);
  if (desde && ref < desde) return false;
  if (hasta && ref > hasta) return false;
  return true;
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

function tecnicoNombre(id: string | null): string | null {
  if (!id) return null;
  return findUserById(id)?.nombre ?? null;
}

export class BalanceService {
  getResumen(
    user: PublicUser,
    rango: BalanceRango | BalancePeriodo = '90d',
  ): BalanceResumen {
    const r: BalanceRango =
      typeof rango === 'string' ? { periodo: rango } : rango;
    const { desde, hasta } = resolveRange(r);
    const casos = casoRepository
      .findByEmpresa(requireTenantEmpresaId(user))
      .filter((c) => inRange(c, desde, hasta));

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
      pagoTecnicos: 0,
      materiales: 0,
      utilidadOperativa: 0,
    };

    for (const c of casos) {
      const ing = ingresoCaso(c);

      // Cobrado = la aseguradora/cliente pagó (no es liquidación al técnico).
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

    // Pago técnicos + materiales: todos los casos del periodo (no dependen del cobro del cliente).
    for (const c of casos) {
      if (c.pagoTecnico != null) totales.pagoTecnicos += c.pagoTecnico;
      totales.materiales += totalMateriales(c.gastosMateriales);
    }

    // Utilidad de caja (OPS): solo cuenta el ingreso Pagado (cliente).
    // Descuenta TODO el costo ops del periodo (técnicos + materiales), aunque parte
    // esté en casos aún Pendiente de pago / por facturar (no es cobro cliente).
    totales.utilidadOperativa =
      totales.ingresosCobrados - totales.pagoTecnicos - totales.materiales;

    // Detalle por caso: solo Pagadas (cliente).
    const casosOperacion = casos
      .filter((c) => c.estado === 'Cobrado' && !c.esGarantia)
      .map((c) => ({
        id: c.id,
        titulo: c.titulo,
        numeroAseguradora: c.numeroAseguradora,
        aseguradora: c.aseguradora,
        tecnicoId: c.tecnicoId,
        tecnicoNombre: tecnicoNombre(c.tecnicoId),
        estado: c.estado,
        ingreso: ingresoCaso(c),
        pagoTecnico: c.pagoTecnico,
        materiales: totalMateriales(c.gastosMateriales),
        utilidad: c.pagoTecnico == null ? null : utilidadOperativa(c),
        updatedAt: c.updatedAt,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Por técnico: a pagar = suma de pagos definidos en el periodo (con o sin cobro cliente).
    const techMap = new Map<string, BalanceResumen['porTecnico'][0]>();
    for (const c of casos) {
      if (!c.tecnicoId) continue;
      if (c.pagoTecnico == null && !c.gestionadoAt) continue;
      const row = techMap.get(c.tecnicoId) ?? {
        tecnicoId: c.tecnicoId,
        tecnicoNombre: tecnicoNombre(c.tecnicoId) ?? 'Técnico',
        casos: 0,
        aPagar: 0,
        pendientesLiquidar: 0,
      };
      row.casos += 1;
      if (c.pagoTecnico == null) row.pendientesLiquidar += 1;
      else row.aPagar += c.pagoTecnico;
      techMap.set(c.tecnicoId, row);
    }
    const porTecnico = [...techMap.values()].sort((a, b) => b.aPagar - a.aPagar);

    return {
      periodo: r.periodo,
      generadoAt: new Date().toISOString(),
      totales,
      porAseguradora,
      casosPendienteEnviar,
      casosPendientePago,
      cobradosRecientes,
      casosOperacion,
      porTecnico,
    };
  }

  getResumenTecnico(
    user: PublicUser,
    rango: BalanceRango | BalancePeriodo = 'month',
  ): BalanceTecnicoResumen {
    if (user.role !== 'TECNICO') {
      throw new AppError(403, 'Solo el técnico puede ver su balance de pagos');
    }
    const r: BalanceRango =
      typeof rango === 'string' ? { periodo: rango } : rango;
    const { desde, hasta } = resolveRange(r);
    const casos = casoRepository
      .findByEmpresa(requireTenantEmpresaId(user))
      .filter((c) => c.tecnicoId === user.id)
      .filter((c) => Boolean(c.gestionadoAt))
      .filter((c) => {
        const ref = new Date(c.gestionadoAt!);
        if (desde && ref < desde) return false;
        if (hasta && ref > hasta) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.gestionadoAt!).getTime() - new Date(a.gestionadoAt!).getTime(),
      );

    let aPagar = 0;
    let casosConPago = 0;
    let casosPendientes = 0;
    const filas = casos.map((c) => {
      if (c.pagoTecnico == null) casosPendientes += 1;
      else {
        casosConPago += 1;
        aPagar += c.pagoTecnico;
      }
      return {
        id: c.id,
        titulo: c.titulo,
        numeroAseguradora: c.numeroAseguradora,
        aseguradora: c.aseguradora,
        estado: c.estado,
        cerradoEn: c.gestionadoAt,
        pagoTecnico: c.pagoTecnico,
        updatedAt: c.updatedAt,
      };
    });

    return {
      periodo: r.periodo,
      generadoAt: new Date().toISOString(),
      totales: {
        aPagar,
        casosConPago,
        casosPendientes,
        casos: casos.length,
      },
      casos: filas,
    };
  }
}

export const balanceService = new BalanceService();
