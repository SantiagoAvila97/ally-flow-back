export interface Aseguradora {
  id: string;
  nombre: string;
  nit: string | null;
  /** Persona responsable / contacto general */
  personaResponsable: string | null;
  /** Contacto directo para cobros o dudas */
  contactoCobros: string | null;
  /** WhatsApp de contacto */
  whatsapp: string | null;
  activa: boolean;
}

export interface CiudadCatalogo {
  id: string;
  nombre: string;
  area: string;
  activa: boolean;
}

/** Payload unificado para formularios (crear caso, filtros, etc.). */
export interface CatalogosPayload {
  aseguradoras: Aseguradora[];
  ciudades: CiudadCatalogo[];
  /** Nombres de categoría de servicio (desde tarifas/costos de la empresa). */
  categoriasServicio: string[];
}
