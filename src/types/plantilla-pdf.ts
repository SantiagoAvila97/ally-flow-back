export type TipoPlantillaPdf = 'tabla_operativa' | 'carta_siniestro';

export interface PlantillaPdfCobro {
  empresaId: string;
  razonSocial: string;
  nit: string;
  ciudad: string;
  telefono: string;
  email: string;
  colorAcento: string;
  textoHeader: string;
  textoFooter: string;
  tipoPlantilla: TipoPlantillaPdf;
  updatedAt: string;
}

export interface ActualizarPlantillaPdfInput {
  razonSocial?: string;
  nit?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  colorAcento?: string;
  textoHeader?: string;
  textoFooter?: string;
  tipoPlantilla?: TipoPlantillaPdf;
}
