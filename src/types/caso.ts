export const ESTADOS_CASO = [
  'PendienteAsignacion',
  'Asignado',
  'EnGestion',
  'PendienteDocumentoCobro',
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
  'Cobrado',
  'EnGarantia',
  'CerradoGarantia',
] as const;

export type EstadoCaso = (typeof ESTADOS_CASO)[number];

export type TipoFirmaCierre = 'TECNICO' | 'ATENDIDO' | 'AMBAS';

/** Timeline de cambios de estado (historial enriquecido). */
export interface HistorialCambio {
  fecha: string;
  estado: EstadoCaso;
  usuarioId: string;
  usuarioNombre: string;
  nota?: string;
}

export interface LineaCobro {
  itemCostoId: string | null;
  nombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

/** Renglón de factura de materiales (foto = factura digital). */
export interface GastoMaterial {
  id: string;
  descripcion: string;
  monto: number;
  /** DataURL o URL de la factura escaneada/foto. */
  fotoUrl: string | null;
}

/** Estados comerciales ocultos al técnico en bandeja/detalle. */
export const ESTADOS_OCULTOS_TECNICO: EstadoCaso[] = [
  'PendienteDocumentoCobro',
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
  'Cobrado',
  'EnGarantia',
  'CerradoGarantia',
];

/** Estados donde ADMIN puede editar gastos de operación. */
export const ESTADOS_GASTOS_OPERACION: EstadoCaso[] = [
  'PendienteDocumentoCobro',
  'PendienteConfirmacionAsegurado',
  'PendienteRecepcionPago',
  'Cobrado',
];

export interface Caso {
  id: string;
  titulo: string;
  descripcion: string;
  /** @deprecated preferir aseguradora; se mantiene como alias de lectura */
  cliente: string;
  estado: EstadoCaso;
  empresaId: string;
  asesorId: string;
  tecnicoId: string | null;

  numeroAseguradora: string;
  aseguradora: string;
  titularNombre: string;
  titularTelefono: string;
  direccion: string;
  ciudad: string;
  /** Coordenadas persistidas al validar en el mapa (creación). */
  lat: number | null;
  lon: number | null;
  direccionNormalizada: string | null;
  categoriaServicio: string;
  observaciones: string;

  fotos: string[];
  firmaAtendidoUrl: string | null;
  firmaTecnicoUrl: string | null;
  gestionadoAt: string | null;

  esGarantia: boolean;
  casoOrigenId: string | null;
  montoEstimado: number | null;

  lineasCobro: LineaCobro[];
  documentoCobroGeneradoAt: string | null;

  /** Lo que se paga al técnico por el servicio (COP). null = aún no liquidado. */
  pagoTecnico: number | null;
  /** Facturas/materiales cargados por la administradora. */
  gastosMateriales: GastoMaterial[];

  historialCambios: HistorialCambio[];
  createdAt: string;
  updatedAt: string;
}

export interface CrearCasoInput {
  titulo: string;
  descripcion?: string;
  numeroAseguradora: string;
  aseguradora: string;
  titularNombre: string;
  titularTelefono: string;
  direccion: string;
  ciudad: string;
  categoriaServicio: string;
  observaciones?: string;
  lat?: number | null;
  lon?: number | null;
  direccionNormalizada?: string;
}
