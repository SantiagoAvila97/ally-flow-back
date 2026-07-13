export type TipoPlantillaPdf = 'tabla_operativa' | 'carta_siniestro';

/** Campos opcionales solo cuando una aseguradora lo pide. */
export interface PlantillaPdfExtras {
  /** Ej. "Área de siniestros" / "Atención: Facturación" */
  destinatario: string;
  /** Código de proveedor ante la aseguradora */
  codigoProveedor: string;
  /** Nota o cláusula adicional en el documento */
  notaAdicional: string;
}

export const EMPTY_PLANTILLA_EXTRAS: PlantillaPdfExtras = {
  destinatario: '',
  codigoProveedor: '',
  notaAdicional: '',
};

export function hasPlantillaExtras(e: PlantillaPdfExtras | undefined | null): boolean {
  if (!e) return false;
  return Boolean(
    e.destinatario.trim() || e.codigoProveedor.trim() || e.notaAdicional.trim(),
  );
}

/**
 * Cabecera y formato son siempre de la plantilla general (aseguradoraId null).
 * Los overrides por aseguradora solo aportan `extras`.
 */
export interface PlantillaPdfCobro {
  id: string;
  empresaId: string;
  /** null = plantilla general; string = extras de esa aseguradora (o vista resuelta) */
  aseguradoraId: string | null;
  razonSocial: string;
  nit: string;
  ciudad: string;
  telefono: string;
  email: string;
  colorAcento: string;
  textoHeader: string;
  textoFooter: string;
  tipoPlantilla: TipoPlantillaPdf;
  extras: PlantillaPdfExtras;
  updatedAt: string;
}

export interface ActualizarPlantillaPdfInput {
  aseguradoraId?: string | null;
  razonSocial?: string;
  nit?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  colorAcento?: string;
  textoHeader?: string;
  textoFooter?: string;
  tipoPlantilla?: TipoPlantillaPdf;
  extras?: Partial<PlantillaPdfExtras>;
}
