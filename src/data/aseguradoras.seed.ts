import { EMPRESA_DEMO } from './empresas.seed';

/**
 * Clientes del tenant (antes “aseguradoras”).
 * Seed solo para DEMO — Full Soluciones y tenants nuevos arrancan vacíos (como tarifas).
 */
export interface AseguradoraSeed {
  id: string;
  empresaId: string;
  nombre: string;
  nit: string | null;
  personaResponsable: string | null;
  contactoCobros: string | null;
  whatsapp: string | null;
  activa: boolean;
}

const DEMO_CLIENTES: Omit<AseguradoraSeed, 'id' | 'empresaId'>[] = [
  {
    nombre: 'Sura Seguros',
    nit: '890903407',
    personaResponsable: 'Ana Gómez',
    contactoCobros: 'cobros.proveedores@sura.com.co',
    whatsapp: '+57 300 111 2233',
    activa: true,
  },
  {
    nombre: 'Liberty Seguros',
    nit: '860031532',
    personaResponsable: 'Carlos Ruiz',
    contactoCobros: 'proveedores@libertycolombia.com',
    whatsapp: '+57 310 222 3344',
    activa: true,
  },
  {
    nombre: 'Mapfre Colombia',
    nit: '891100912',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    nombre: 'Bolívar Seguros',
    nit: '860002180',
    personaResponsable: 'Laura Méndez',
    contactoCobros: 'facturacion@segurosbolivar.com',
    whatsapp: '+57 320 444 5566',
    activa: true,
  },
  {
    nombre: 'Seguros del Pacífico S.A.',
    nit: null,
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    nombre: 'Allianz Seguros',
    nit: '860002503',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    nombre: 'AXA Colpatria',
    nit: '860002184',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    nombre: 'Equidad Seguros',
    nit: null,
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    nombre: 'Estado Seguros',
    nit: null,
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
  {
    nombre: 'Previsora Seguros',
    nit: '860002400',
    personaResponsable: null,
    contactoCobros: null,
    whatsapp: null,
    activa: true,
  },
];

function slug(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
}

/** Solo tenant DEMO. */
export const ASEGURADORAS_SEED: AseguradoraSeed[] = DEMO_CLIENTES.map((c) => ({
  ...c,
  id: `aseg-demo-${slug(c.nombre)}`,
  empresaId: EMPRESA_DEMO,
}));
