import type { Caso, EstadoCaso, HistorialCambio, LineaCobro } from '../types/caso';
import { EMPRESA_DEMO } from './empresas.seed';
import { DEMO_ASESOR_IDS, DEMO_TECNICO_IDS, findUserById } from './users.seed';

/** Fechas relativas al arranque (mocks variados para ordenar en UI). */
function ago(days: number, hours = 0, minutes = 0): string {
  return new Date(
    Date.now() - days * 86_400_000 - hours * 3_600_000 - minutes * 60_000,
  ).toISOString();
}

const now = ago(0);
const dayAgo = ago(1, 2);
const twoDaysAgo = ago(2, 5);
const threeDaysAgo = ago(3, 1);
const weekAgo = ago(7);
const twoWeeksAgo = ago(14);

/**
 * Distribuye createdAt / updatedAt en ~6 semanas con hora distinta por índice.
 * Así la bandeja no muestra todo con la misma fecha.
 */
function fechasParaIndice(index: number): { createdAt: string; updatedAt: string } {
  const daysBack = (index * 11 + (index % 7) * 3) % 42; // 0–41 días
  const hours = (index * 5 + 3) % 20; // 0–19 h
  const minutes = (index * 13) % 55;
  const updatedAt = ago(daysBack, hours, minutes);
  const createdLagDays = 1 + (index % 6);
  const createdAt = ago(daysBack + createdLagDays, (hours + 2) % 20, minutes);
  return { createdAt, updatedAt };
}

interface EmpresaSeedCtx {
  empresaId: string;
  prefix: string;
  /** Pool DEMO: se rota por índice de caso. */
  asesorIds: readonly string[];
  tecnicoIds: readonly string[];
  adminId: string;
  adminNombre: string;
}

interface CasoDemoDef {
  estado: EstadoCaso;
  titulo: string;
  numeroAseguradora: string;
  aseguradora: string;
  titularNombre: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  categoriaServicio: string;
  observaciones: string;
  esGarantia?: boolean;
  conTecnico: boolean;
  conFotos?: boolean;
  conFirma?: boolean;
  /** Paquete de líneas de cobro (solo estados comerciales / cobrado). */
  lineas?: LineaCobro[];
  updatedAt?: string;
}

function hist(
  fecha: string,
  estado: EstadoCaso,
  usuarioId: string,
  usuarioNombre: string,
  nota?: string,
): HistorialCambio {
  return { fecha, estado, usuarioId, usuarioNombre, nota };
}

function buildTimeline(
  ctx: EmpresaSeedCtx,
  estado: EstadoCaso,
  staff: { asesorId: string; asesorNombre: string; tecnicoId: string; tecnicoNombre: string },
): HistorialCambio[] {
  const t: HistorialCambio[] = [
    hist(threeDaysAgo, 'PendienteAsignacion', staff.asesorId, staff.asesorNombre, 'Caso creado'),
  ];

  if (estado === 'PendienteAsignacion') return t;

  t.push(
    hist(twoDaysAgo, 'Asignado', ctx.adminId, ctx.adminNombre, `Asignado a ${staff.tecnicoNombre}`),
  );
  if (estado === 'Asignado') return t;

  if (estado === 'EnGarantia') {
    t.push(hist(dayAgo, 'EnGestion', staff.tecnicoId, staff.tecnicoNombre, 'Gestion'));
    t.push(
      hist(dayAgo, 'PendienteDocumentoCobro', staff.tecnicoId, staff.tecnicoNombre, 'Completado'),
    );
    t.push(hist(dayAgo, 'Cobrado', staff.asesorId, staff.asesorNombre, 'Cobrado'));
    t.push(hist(now, 'EnGarantia', ctx.adminId, ctx.adminNombre, 'Reabierto por garantia'));
    return t;
  }

  if (estado === 'CerradoGarantia') {
    t.push(hist(twoDaysAgo, 'EnGestion', staff.tecnicoId, staff.tecnicoNombre, 'Gestion'));
    t.push(
      hist(
        twoDaysAgo,
        'PendienteDocumentoCobro',
        staff.tecnicoId,
        staff.tecnicoNombre,
        'Completado',
      ),
    );
    t.push(hist(twoDaysAgo, 'Cobrado', staff.asesorId, staff.asesorNombre, 'Cobrado'));
    t.push(hist(dayAgo, 'EnGarantia', ctx.adminId, ctx.adminNombre, 'Garantia'));
    t.push(
      hist(now, 'Cobrado', staff.tecnicoId, staff.tecnicoNombre, 'Garantia cerrada — vuelve a Pagada'),
    );
    return t;
  }

  t.push(hist(dayAgo, 'EnGestion', staff.tecnicoId, staff.tecnicoNombre, 'Gestion iniciada'));
  if (estado === 'EnGestion') return t;

  t.push(
    hist(dayAgo, 'PendienteDocumentoCobro', staff.tecnicoId, staff.tecnicoNombre, 'Gestion completada'),
  );
  if (estado === 'PendienteDocumentoCobro') return t;

  t.push(
    hist(
      dayAgo,
      'PendienteConfirmacionAsegurado',
      staff.asesorId,
      staff.asesorNombre,
      'Documento de cobro generado',
    ),
  );
  if (estado === 'PendienteConfirmacionAsegurado') return t;

  t.push(
    hist(
      dayAgo,
      'PendienteRecepcionPago',
      staff.asesorId,
      staff.asesorNombre,
      'Confirmado por asegurado',
    ),
  );
  if (estado === 'PendienteRecepcionPago') return t;

  t.push(hist(now, 'Cobrado', staff.asesorId, staff.asesorNombre, 'Marcado cobrado'));
  return t;
}

function L(
  nombre: string,
  unidad: string,
  cantidad: number,
  precioUnitario: number,
): LineaCobro {
  return { itemCostoId: null, nombre, unidad, cantidad, precioUnitario };
}

/** Paquetes de cobro con montos ficticios pero realistas y variados. */
const PACK = {
  chico: [L('Destape de desagüe', 'servicio', 1, 180_000), L('Visita técnica', 'und', 1, 95_000)], // 275k
  medio: [L('Tubería de 1/2"', 'metro', 8, 110_000), L('Cambio de sifón', 'und', 2, 75_000)], // 1.03M
  grande: [
    L('Cambio de vidrio templado', 'und', 4, 680_000),
    L('Mano de obra especializada', 'servicio', 1, 450_000),
  ], // 3.17M
  xl: [
    L('Reparación estructural menor', 'servicio', 1, 2_400_000),
    L('Materiales varios', 'kit', 1, 980_000),
    L('Visita técnica', 'und', 2, 120_000),
  ], // 3.62M
  mega: [
    L('Cambio de vidrio templado', 'und', 6, 520_000),
    L('Tubería de 1/2"', 'metro', 20, 95_000),
    L('Destape de desagüe', 'servicio', 3, 150_000),
  ], // 5.57M
  vip: [
    L('Reparación integral local', 'servicio', 1, 3_200_000),
    L('Cambio de vidrio templado', 'und', 2, 480_000),
  ], // 4.16M
  light: [L('Visita técnica', 'und', 1, 120_000), L('Cambio de sifón', 'und', 1, 85_000)], // 205k
  mixto: [
    L('Destape de desagüe', 'servicio', 2, 220_000),
    L('Tubería de 1/4"', 'metro', 12, 85_000),
    L('Mano de obra', 'hora', 6, 65_000),
  ], // 1.85M
  alto: [
    L('Cambio de calentador', 'und', 1, 1_850_000),
    L('Instalación y puesta en marcha', 'servicio', 1, 420_000),
  ], // 2.27M
  office: [
    L('Reparación red hidráulica oficina', 'servicio', 1, 980_000),
    L('Destape de desagüe', 'servicio', 4, 140_000),
  ], // 1.54M
};

function sumLineas(lineas: LineaCobro[]): number {
  return lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
}

function buildCaso(ctx: EmpresaSeedCtx, def: CasoDemoDef, index: number): Caso {
  const id = `${ctx.prefix}-${String(index).padStart(3, '0')}`;
  const esGarantia =
    !!def.esGarantia || def.estado === 'EnGarantia' || def.estado === 'CerradoGarantia';

  const comercial =
    def.estado === 'PendienteDocumentoCobro' ||
    def.estado === 'PendienteConfirmacionAsegurado' ||
    def.estado === 'PendienteRecepcionPago' ||
    def.estado === 'Cobrado';

  const lineas = comercial ? (def.lineas ?? PACK.medio) : [];
  const { createdAt, updatedAt: autoUpdated } = fechasParaIndice(index);
  const updatedAt = def.updatedAt ?? autoUpdated;
  const updatedMs = Date.parse(updatedAt);

  const asesorId = ctx.asesorIds[(index - 1) % ctx.asesorIds.length]!;
  const tecnicoPoolId = ctx.tecnicoIds[(index - 1) % ctx.tecnicoIds.length]!;
  const staff = {
    asesorId,
    asesorNombre: findUserById(asesorId)?.nombre ?? 'Asesor',
    tecnicoId: tecnicoPoolId,
    tecnicoNombre: findUserById(tecnicoPoolId)?.nombre ?? 'Técnico',
  };

  /** Cobranza o visita ya cerrada: ops con montos para balance DEMO realista. */
  const conOps = comercial || !!def.conFirma;
  const pagoTecnico = conOps ? 45_000 + (index % 5) * 10_000 : null;
  const gastosMateriales = conOps
    ? [
        {
          id: `mat-${ctx.prefix}-${index}-1`,
          descripcion: 'Factura ferretería / materiales',
          monto: 25_000 + (index % 4) * 5_000,
          fotoUrl: `https://placehold.co/480x320/png?text=Factura+${index}`,
        },
        ...(index % 3 === 0
          ? [
              {
                id: `mat-${ctx.prefix}-${index}-2`,
                descripcion: 'Repuestos / consumibles',
                monto: 15_000 + (index % 3) * 8_000,
                fotoUrl: `https://placehold.co/480x320/png?text=Factura+B${index}`,
              },
            ]
          : []),
      ]
    : [];

  return {
    id,
    titulo: def.titulo,
    descripcion: def.observaciones,
    cliente: def.aseguradora,
    estado: def.estado,
    empresaId: ctx.empresaId,
    asesorId: staff.asesorId,
    tecnicoId: def.conTecnico ? staff.tecnicoId : null,
    numeroAseguradora: def.numeroAseguradora,
    aseguradora: def.aseguradora,
    titularNombre: def.titularNombre,
    titularTelefono: def.telefono,
    direccion: def.direccion,
    ciudad: def.ciudad,
    categoriaServicio: def.categoriaServicio,
    observaciones: def.observaciones,
    lat: null,
    lon: null,
    direccionNormalizada: null,
    fotos: def.conFotos
      ? [`https://placehold.co/600x400/111111/ffffff?text=${encodeURIComponent(def.estado)}`]
      : [],
    firmaAtendidoUrl: def.conFirma
      ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      : null,
    firmaTecnicoUrl: null,
    gestionadoAt: def.conFirma ? new Date(updatedMs - 3_600_000).toISOString() : null,
    esGarantia,
    casoOrigenId: esGarantia ? `${ctx.prefix}-origen` : null,
    montoEstimado: comercial ? sumLineas(lineas) : null,
    lineasCobro: lineas,
    documentoCobroGeneradoAt:
      def.estado === 'PendienteConfirmacionAsegurado' ||
      def.estado === 'PendienteRecepcionPago' ||
      def.estado === 'Cobrado'
        ? new Date(updatedMs - 86_400_000).toISOString()
        : null,
    pagoTecnico,
    gastosMateriales,
    historialCambios: buildTimeline(ctx, def.estado, staff),
    createdAt,
    updatedAt,
  };
}

const DEFS_DEMO: CasoDemoDef[] = [
  // Operación 3+4+5
  {
    estado: 'PendienteAsignacion',
    titulo: 'Inspección sede RRHH - sin técnico',
    numeroAseguradora: 'DEMO-PA-001',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Industrias Caribe S.A.S.',
    telefono: '+57 605 111 0000',
    direccion: 'Zona Franca La Candelaria',
    ciudad: 'Barranquilla',
    categoriaServicio: 'Electricidad',
    observaciones: 'Carnet de visitante.',
    conTecnico: false,
  },
  {
    estado: 'PendienteAsignacion',
    titulo: 'Hogar - filtración sin asignar',
    numeroAseguradora: 'DEMO-PA-002',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Laura Mejía',
    telefono: '+57 300 222 3344',
    direccion: 'Calle 10 #43-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Conjunto cerrado.',
    conTecnico: false,
  },
  {
    estado: 'PendienteAsignacion',
    titulo: 'Local - vidrio vitrina',
    numeroAseguradora: 'DEMO-PA-003',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Moda Central',
    telefono: '+57 604 555 1212',
    direccion: 'Calle 10 #42-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Urgente por seguridad.',
    conTecnico: false,
  },
  {
    estado: 'Asignado',
    titulo: 'Glass flota - parabrisas',
    numeroAseguradora: 'DEMO-AS-001',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Transportes del Valle',
    telefono: '+57 604 222 3344',
    direccion: 'Carrera 70 #32-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Patio 7am-4pm.',
    conTecnico: true,
  },
  {
    estado: 'Asignado',
    titulo: 'Apartamento - destape',
    numeroAseguradora: 'DEMO-AS-002',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Sebastián Ruiz',
    telefono: '+57 310 888 1122',
    direccion: 'Calle 33 #75-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Portería pide cédula.',
    conTecnico: true,
  },
  {
    estado: 'Asignado',
    titulo: 'Oficina - sifón',
    numeroAseguradora: 'DEMO-AS-003',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Contadores del Valle',
    telefono: '+57 604 333 9900',
    direccion: 'Cra 43A #1Sur-50',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Piso 4.',
    conTecnico: true,
  },
  {
    estado: 'Asignado',
    titulo: 'Hogar - tubería',
    numeroAseguradora: 'DEMO-AS-004',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Familia Giraldo',
    telefono: '+57 301 444 5566',
    direccion: 'Calle 7 Sur #34-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Corte de agua 9am.',
    conTecnico: true,
  },
  {
    estado: 'EnGestion',
    titulo: 'Peritaje motocicleta - en campo',
    numeroAseguradora: 'DEMO-EG-001',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Diego Pardo',
    telefono: '+57 320 777 8899',
    direccion: 'Calle 50 #45-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Taller zona industrial.',
    conTecnico: true,
    conFotos: true,
  },
  {
    estado: 'EnGestion',
    titulo: 'Local - grasas',
    numeroAseguradora: 'DEMO-EG-002',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Asados del Parque',
    telefono: '+57 604 111 2233',
    direccion: 'Calle 10 #40-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Después de mediodía.',
    conTecnico: true,
    conFotos: true,
  },
  {
    estado: 'EnGestion',
    titulo: 'Glass fachada - en sitio',
    numeroAseguradora: 'DEMO-EG-003',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Torre Poblado',
    telefono: '+57 300 909 3344',
    direccion: 'Cra 43A #5-50',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Andamio listo.',
    conTecnico: true,
    conFotos: true,
  },
  {
    estado: 'EnGestion',
    titulo: 'Apartamento - calentador',
    numeroAseguradora: 'DEMO-EG-004',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Natalia Vélez',
    telefono: '+57 315 202 3344',
    direccion: 'Calle 4 Sur #43-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Gas cerrado.',
    conTecnico: true,
    conFotos: true,
  },
  {
    estado: 'EnGestion',
    titulo: 'Hogar - destape múltiple',
    numeroAseguradora: 'DEMO-EG-005',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Héctor López',
    telefono: '+57 311 303 4455',
    direccion: 'Calle 30 #65-12',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Varios puntos.',
    conTecnico: true,
    conFotos: true,
  },

  // Por enviar: 4
  {
    estado: 'PendienteDocumentoCobro',
    titulo: 'Calentador - documento por enviar',
    numeroAseguradora: 'DEMO-PD-001',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Camila Restrepo',
    telefono: '+57 300 111 4455',
    direccion: 'Cra 43A #1-50',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Listo para armar documento oficial de cobro.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.alto,
  },
  {
    estado: 'PendienteDocumentoCobro',
    titulo: 'Glass flota - armar PDF',
    numeroAseguradora: 'DEMO-PD-002',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Logística Antioquia',
    telefono: '+57 604 222 7788',
    direccion: 'Calle 30 #65-40',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Firmas listas.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.grande,
  },
  {
    estado: 'PendienteDocumentoCobro',
    titulo: 'Oficina - cobro pendiente PDF',
    numeroAseguradora: 'DEMO-PD-003',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Grupo Caribe Soft',
    telefono: '+57 605 333 9900',
    direccion: 'Calle 72 #54-10',
    ciudad: 'Barranquilla',
    categoriaServicio: 'Plomería',
    observaciones: 'Armar documento.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.office,
  },
  {
    estado: 'PendienteDocumentoCobro',
    titulo: 'VIP local - sin PDF',
    numeroAseguradora: 'DEMO-PD-004',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Galería Suramericana',
    telefono: '+57 604 444 1122',
    direccion: 'Calle 10 #42-30',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Trabajo mayor.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.vip,
  },

  // Confirmación: 3
  {
    estado: 'PendienteConfirmacionAsegurado',
    titulo: 'Asistencia vial - pendiente confirmación',
    numeroAseguradora: 'DEMO-CA-001',
    aseguradora: 'Sura Seguros',
    titularNombre: 'María Cano',
    telefono: '+57 301 555 6677',
    direccion: 'Av. Las Palmas Km 5',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Documento listo; espera confirmación.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.medio,
  },
  {
    estado: 'PendienteConfirmacionAsegurado',
    titulo: 'Mega glass - confirmación',
    numeroAseguradora: 'DEMO-CA-002',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Flota Andina',
    telefono: '+57 320 666 7788',
    direccion: 'Calle 50 #70-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'PDF en revisión del asegurado.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.mega,
  },
  {
    estado: 'PendienteConfirmacionAsegurado',
    titulo: 'Mixto hidráulico - confirmación',
    numeroAseguradora: 'DEMO-CA-003',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Conjunto Laureles',
    telefono: '+57 604 777 8899',
    direccion: 'Circular 74 #39-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Espera OK.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.mixto,
  },

  // Pago: 5
  {
    estado: 'PendienteRecepcionPago',
    titulo: 'Trampa grasas - espera pago',
    numeroAseguradora: 'DEMO-RP-001',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Local Plaza Mayor',
    telefono: '+57 604 888 1212',
    direccion: 'Calle 10 #43-40 Local 12',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Confirmado; pendiente recepción del pago.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.chico,
  },
  {
    estado: 'PendienteRecepcionPago',
    titulo: 'XL estructural - pago en trámite',
    numeroAseguradora: 'DEMO-RP-002',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Edificio Centro',
    telefono: '+57 604 101 2020',
    direccion: 'Calle 50 #46-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Tesorería en proceso.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.xl,
  },
  {
    estado: 'PendienteRecepcionPago',
    titulo: 'VIP - espera consignación',
    numeroAseguradora: 'DEMO-RP-003',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Centro Comercial Unicentro',
    telefono: '+57 604 303 4040',
    direccion: 'Calle 52 #25-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Saldo pendiente.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.vip,
  },
  {
    estado: 'PendienteRecepcionPago',
    titulo: 'Calentador - pago',
    numeroAseguradora: 'DEMO-RP-004',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Familia Restrepo',
    telefono: '+57 300 505 6060',
    direccion: 'Calle 8 Sur #43-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Radicado en cuentas.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.alto,
  },
  {
    estado: 'PendienteRecepcionPago',
    titulo: 'Oficina hidráulica - pago',
    numeroAseguradora: 'DEMO-RP-005',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Barranquilla Soft',
    telefono: '+57 605 707 8080',
    direccion: 'Calle 76 #54-20',
    ciudad: 'Barranquilla',
    categoriaServicio: 'Plomería',
    observaciones: 'Espera transferencia.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.office,
  },

  // Cobrados: 7
  {
    estado: 'Cobrado',
    titulo: 'Inspección corporativa - cobrada',
    numeroAseguradora: 'DEMO-CO-001',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Grupo Andino',
    telefono: '+57 604 333 2211',
    direccion: 'Cll 10 #43-40',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Pago registrado.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.medio,
    updatedAt: dayAgo,
  },
  {
    estado: 'Cobrado',
    titulo: 'Glass flota - cobrado',
    numeroAseguradora: 'DEMO-CO-002',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Transportes del Valle',
    telefono: '+57 604 222 3344',
    direccion: 'Carrera 70 #32-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Cobrado.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.grande,
    updatedAt: twoDaysAgo,
  },
  {
    estado: 'Cobrado',
    titulo: 'Mega reparación - cobrado',
    numeroAseguradora: 'DEMO-CO-003',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Plaza Mayor Locales',
    telefono: '+57 604 999 1122',
    direccion: 'Calle 10 #43-50',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Pago grande.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.mega,
    updatedAt: threeDaysAgo,
  },
  {
    estado: 'Cobrado',
    titulo: 'Calentador - cobrado',
    numeroAseguradora: 'DEMO-CO-004',
    aseguradora: 'Bolívar Seguros',
    titularNombre: 'Familia Cano',
    telefono: '+57 301 111 2233',
    direccion: 'Calle 5 Sur #34-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Cerrado.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.alto,
    updatedAt: weekAgo,
  },
  {
    estado: 'Cobrado',
    titulo: 'Chico destape - cobrado',
    numeroAseguradora: 'DEMO-CO-005',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Apto Laureles 302',
    telefono: '+57 310 222 3344',
    direccion: 'Circular 73 #39-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Pago menor.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.chico,
    updatedAt: weekAgo,
  },
  {
    estado: 'Cobrado',
    titulo: 'VIP - cobrado',
    numeroAseguradora: 'DEMO-CO-006',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Centro Comercial Premier',
    telefono: '+57 604 444 5566',
    direccion: 'Calle 52 #25-30',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Cobro VIP.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.vip,
    updatedAt: twoWeeksAgo,
  },
  {
    estado: 'Cobrado',
    titulo: 'Oficina - cobrado',
    numeroAseguradora: 'DEMO-CO-007',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Soft Caribe',
    telefono: '+57 605 555 6677',
    direccion: 'Calle 76 #54-30',
    ciudad: 'Barranquilla',
    categoriaServicio: 'Plomería',
    observaciones: 'Factura pagada.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    lineas: PACK.office,
    updatedAt: twoWeeksAgo,
  },

  // Garantía
  {
    estado: 'EnGarantia',
    titulo: 'Garantía peritaje moto',
    numeroAseguradora: 'DEMO-GA-001',
    aseguradora: 'Sura Seguros',
    titularNombre: 'Diego Pardo',
    telefono: '+57 320 777 8899',
    direccion: 'Calle 50 #45-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Revisita garantía.',
    conTecnico: true,
    esGarantia: true,
  },
  {
    estado: 'EnGarantia',
    titulo: 'Garantía glass - revisit',
    numeroAseguradora: 'DEMO-GA-002',
    aseguradora: 'Liberty Seguros',
    titularNombre: 'Transportes del Valle',
    telefono: '+57 604 222 3344',
    direccion: 'Carrera 70 #32-10',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Ajuste garantía.',
    conTecnico: true,
    esGarantia: true,
  },
  {
    estado: 'Cobrado',
    titulo: 'Garantía asistencia - cerrada (Pagada)',
    numeroAseguradora: 'DEMO-CG-001',
    aseguradora: 'Sura Seguros',
    titularNombre: 'María Cano',
    telefono: '+57 301 555 6677',
    direccion: 'Av. Las Palmas Km 5',
    ciudad: 'Medellín',
    categoriaServicio: 'Plomería',
    observaciones: 'Garantía finalizada; vuelve a Pagada.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    esGarantia: false,
    lineas: PACK.medio,
  },
  {
    estado: 'Cobrado',
    titulo: 'Garantía destape - cerrada (Pagada)',
    numeroAseguradora: 'DEMO-CG-002',
    aseguradora: 'Mapfre Colombia',
    titularNombre: 'Sebastián Ruiz',
    telefono: '+57 310 888 1122',
    direccion: 'Calle 33 #75-20',
    ciudad: 'Medellín',
    categoriaServicio: 'Electricidad',
    observaciones: 'Cerrada; vuelve a Pagada.',
    conTecnico: true,
    conFotos: true,
    conFirma: true,
    esGarantia: false,
    lineas: PACK.medio,
  },
];

const CTX_DEMO: EmpresaSeedCtx = {
  empresaId: EMPRESA_DEMO,
  prefix: 'caso-demo',
  asesorIds: DEMO_ASESOR_IDS,
  tecnicoIds: DEMO_TECNICO_IDS,
  adminId: 'usr-demo-admin',
  adminNombre: 'Nora Admin Demo',
};

/**
 * Persistencia MVP: se clona en RAM al arrancar (`InMemoryCasoRepository`).
 * Solo tenant DEMO: ~80 casos para ejercitar paginación (pageSize máx. 50).
 * Full Soluciones y demás tenants: sin casos por defecto.
 */
function expandDefs(defs: CasoDemoDef[], target: number, tag: string): CasoDemoDef[] {
  if (defs.length >= target) return defs.slice(0, target);
  const extra: CasoDemoDef[] = [];
  let i = 0;
  while (defs.length + extra.length < target) {
    const base = defs[i % defs.length]!;
    const n = defs.length + extra.length + 1;
    extra.push({
      ...base,
      titulo: `${base.titulo} · lote ${n}`,
      numeroAseguradora: `${tag}-${String(n).padStart(3, '0')}`,
      titularNombre: `${base.titularNombre} (${n})`,
    });
    i += 1;
  }
  return [...defs, ...extra];
}

const DEFS_DEMO_80 = expandDefs(DEFS_DEMO, 80, 'DEMO');

export const CASOS_SEED: Caso[] = [
  ...DEFS_DEMO_80.map((d, i) => buildCaso(CTX_DEMO, d, i + 1)),
];
