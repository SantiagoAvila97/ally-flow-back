import { EMPRESA_FULL, EMPRESA_NORTE } from './empresas.seed';
import type { PlantillaPdfCobro } from '../types/plantilla-pdf';

const now = '2026-07-01T10:00:00.000Z';

export const PLANTILLAS_PDF_SEED: PlantillaPdfCobro[] = [
  {
    empresaId: EMPRESA_FULL,
    razonSocial: 'Full Soluciones S.A.S.',
    nit: '901.234.567-8',
    ciudad: 'Bogota D.C.',
    telefono: '+57 601 555 0100',
    email: 'cobros@fullsoluciones.com',
    colorAcento: '#0f766e',
    textoHeader: 'Documento de cobro operativo',
    textoFooter: 'Full Soluciones — operación de campo y recaudo. Documento generado por Ally Flow.',
    tipoPlantilla: 'tabla_operativa',
    updatedAt: now,
  },
  {
    empresaId: EMPRESA_NORTE,
    razonSocial: 'Norte Seguros Ltda.',
    nit: '800.987.654-3',
    ciudad: 'Medellin',
    telefono: '+57 604 444 2200',
    email: 'siniestros@norteseguros.com',
    colorAcento: '#1e3a5f',
    textoHeader: 'Liquidacion de honorarios / reclamo',
    textoFooter:
      'Norte Seguros — documento de reclamacion para aseguradora. Generado por Ally Flow.',
    tipoPlantilla: 'carta_siniestro',
    updatedAt: now,
  },
];
