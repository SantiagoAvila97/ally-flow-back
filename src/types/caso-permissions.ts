import type { EstadoCaso } from './caso';
import type { Role } from './roles';
import { AppError } from '../middlewares/error.middleware';
import type { PublicUser } from './user';

/**
 * Acciones de negocio sobre un caso.
 * La API y el service validan con esta matriz (fuente de verdad).
 */
export type CasoAction =
  | 'crear'
  | 'asignar'
  | 'iniciar'
  | 'fotos'
  | 'documentar'
  | 'completar'
  | 'lineas_cobro'
  | 'enviar_documento'
  | 'confirmar_asegurado'
  | 'cobrar'
  | 'garantia'
  /** Pago técnico + edición completa de materiales: solo ADMIN (auditoría). */
  | 'gastos_operacion'
  /** Adjuntar materiales/facturas (append): ASESOR + ADMIN tras cierre de visita. */
  | 'materiales_adjuntar';

/** Quién puede ejecutar cada acción (sin importar estado — el estado se valida aparte). */
export const CASO_ACTION_ROLES: Record<CasoAction, readonly Role[]> = {
  crear: ['ASESOR', 'ADMIN'],
  asignar: ['ASESOR', 'ADMIN'],
  iniciar: ['TECNICO'],
  fotos: ['TECNICO'],
  documentar: ['TECNICO'],
  completar: ['TECNICO'],
  /** Armar ítems / PDF / marcar enviado: operación comercial ASESOR + ADMIN */
  lineas_cobro: ['ASESOR', 'ADMIN'],
  enviar_documento: ['ASESOR', 'ADMIN'],
  /** Cobranza / cierre contable: solo ADMIN */
  confirmar_asegurado: ['ADMIN'],
  cobrar: ['ADMIN'],
  garantia: ['ADMIN'],
  /** Pago técnico + modificar/borrar materiales: solo ADMIN */
  gastos_operacion: ['ADMIN'],
  materiales_adjuntar: ['ASESOR', 'ADMIN'],
};

/** Estados desde los que puede partir cada acción. */
export const CASO_ACTION_FROM: Record<CasoAction, readonly EstadoCaso[] | null> = {
  crear: null,
  asignar: ['PendienteAsignacion', 'EnGarantia', 'Asignado'],
  iniciar: ['Asignado'],
  fotos: ['EnGestion'],
  documentar: ['EnGestion'],
  completar: ['EnGestion'],
  lineas_cobro: ['PendienteDocumentoCobro'],
  enviar_documento: ['PendienteDocumentoCobro'],
  confirmar_asegurado: ['PendienteConfirmacionAsegurado'],
  cobrar: ['PendienteRecepcionPago'],
  garantia: ['Cobrado', 'CerradoGarantia'],
  gastos_operacion: [
    'PendienteDocumentoCobro',
    'PendienteConfirmacionAsegurado',
    'PendienteRecepcionPago',
    'Cobrado',
  ],
  materiales_adjuntar: [
    'PendienteDocumentoCobro',
    'PendienteConfirmacionAsegurado',
    'PendienteRecepcionPago',
    'Cobrado',
  ],
};

export function assertCasoActionRole(user: PublicUser, action: CasoAction): void {
  const allowed = CASO_ACTION_ROLES[action];
  if (!allowed.includes(user.role)) {
    throw new AppError(
      403,
      `Sin permiso para «${action}». Requiere: ${allowed.join(' o ')}`,
    );
  }
}

export function assertCasoActionEstado(
  estado: EstadoCaso,
  action: CasoAction,
): void {
  const from = CASO_ACTION_FROM[action];
  if (!from) return;
  if (!from.includes(estado)) {
    throw new AppError(
      400,
      `No se puede «${action}» en estado ${estado}. Esperado: ${from.join(' | ')}`,
    );
  }
}

export function assertCasoAction(
  user: PublicUser,
  estado: EstadoCaso | null,
  action: CasoAction,
): void {
  assertCasoActionRole(user, action);
  if (estado) assertCasoActionEstado(estado, action);
}
