import { EMPRESA_FULL, EMPRESA_DEMO } from './empresas.seed';
import { EMPTY_PLANTILLA_EXTRAS, type PlantillaPdfCobro } from '../types/plantilla-pdf';

const now = '2026-07-01T10:00:00.000Z';

export const PLANTILLAS_PDF_SEED: PlantillaPdfCobro[] = [
  {
    id: 'pdf-full-default',
    empresaId: EMPRESA_FULL,
    aseguradoraId: null,
    razonSocial: 'Full Soluciones S.A.S.',
    nit: '901.234.567-8',
    ciudad: 'Bogota D.C.',
    telefono: '+57 601 555 0100',
    email: 'cobros@fullsoluciones.com',
    colorAcento: '#0f766e',
    textoHeader: 'Factura para cobro',
    textoFooter: 'Full Soluciones — operación de campo y recaudo. Documento generado por Ally Flow.',
    tipoPlantilla: 'tabla_operativa',
    extras: { ...EMPTY_PLANTILLA_EXTRAS },
    updatedAt: now,
  },
  {
    id: 'pdf-demo-default',
    empresaId: EMPRESA_DEMO,
    aseguradoraId: null,
    razonSocial: 'DEMO Ltda.',
    nit: '800.987.654-3',
    ciudad: 'Medellin',
    telefono: '+57 604 444 2200',
    email: 'cobros@demo.local',
    colorAcento: '#1e3a5f',
    textoHeader: 'Factura para cobro',
    textoFooter: 'DEMO — documento de reclamacion para aseguradora. Generado por Ally Flow.',
    tipoPlantilla: 'tabla_operativa',
    extras: { ...EMPTY_PLANTILLA_EXTRAS },
    updatedAt: now,
  },
];
