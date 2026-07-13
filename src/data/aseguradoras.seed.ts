/**
 * Catálogo de aseguradoras (mock in-memory).
 */
export interface AseguradoraSeed {
  id: string;
  nombre: string;
  nit: string | null;
  personaResponsable: string | null;
  contactoCobros: string | null;
  whatsapp: string | null;
  activa: boolean;
}

export const ASEGURADORAS_SEED: AseguradoraSeed[] = [
  {
    id: 'aseg-sura',
    nombre: 'Sura Seguros',
    nit: '890903407',
    personaResponsable: 'Ana Gómez',
    contactoCobros: 'cobros.proveedores@sura.com.co',
    whatsapp: '+57 300 111 2233',
    activa: true,
  },
  {
    id: 'aseg-liberty',
    nombre: 'Liberty Seguros',
    nit: '860031532',
    personaResponsable: 'Carlos Ruiz',
    contactoCobros: 'proveedores@libertycolombia.com',
    whatsapp: '+57 310 222 3344',
    activa: true,
  },
  {
    id: 'aseg-mapfre',
    nombre: 'Mapfre Colombia',
    nit: '891100912',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    id: 'aseg-bolivar',
    nombre: 'Bolívar Seguros',
    nit: '860002180',
    personaResponsable: 'Laura Méndez',
    contactoCobros: 'facturacion@segurosbolivar.com',
    whatsapp: '+57 320 444 5566',
    activa: true,
  },
  {
    id: 'aseg-pacifico',
    nombre: 'Seguros del Pacífico S.A.',
    nit: null,
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    id: 'aseg-allianz',
    nombre: 'Allianz Seguros',
    nit: '860002503',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    id: 'aseg-axa',
    nombre: 'AXA Colpatria',
    nit: '860002184',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    id: 'aseg-equidad',
    nombre: 'Equidad Seguros',
    nit: null,
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    id: 'aseg-estado',
    nombre: 'Estado Seguros',
    nit: null,
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    id: 'aseg-previsora',
    nombre: 'Previsora Seguros',
    nit: '860002400',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
];
