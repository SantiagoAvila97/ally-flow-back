import { ASEGURADORAS_SEED } from '../data/aseguradoras.seed';
import { CIUDADES_CATALOGO_SEED } from '../data/ciudades-catalogo.seed';
import {
  persistAseguradora,
  persistCiudad,
  persistDeleteAseguradora,
  persistDeleteCiudad,
} from '../db/persist';
import type { Aseguradora, CiudadCatalogo } from '../types/catalogo';

export interface CreateAseguradoraInput {
  nombre: string;
  nit?: string | null;
  personaResponsable?: string | null;
  contactoCobros?: string | null;
  whatsapp?: string | null;
  activa?: boolean;
}

export interface UpdateAseguradoraInput {
  nombre?: string;
  nit?: string | null;
  personaResponsable?: string | null;
  contactoCobros?: string | null;
  whatsapp?: string | null;
  activa?: boolean;
}

export interface CreateCiudadInput {
  nombre: string;
  area?: string;
  activa?: boolean;
}

export interface UpdateCiudadInput {
  nombre?: string;
  area?: string;
  activa?: boolean;
}

export interface ICatalogoRepository {
  listAseguradoras(soloActivas?: boolean): Aseguradora[];
  findAseguradoraById(id: string): Aseguradora | undefined;
  findAseguradoraByNombre(nombre: string): Aseguradora | undefined;
  createAseguradora(input: CreateAseguradoraInput): Aseguradora;
  updateAseguradora(id: string, input: UpdateAseguradoraInput): Aseguradora | undefined;
  deleteAseguradora(id: string): boolean;

  listCiudades(soloActivas?: boolean): CiudadCatalogo[];
  findCiudadById(id: string): CiudadCatalogo | undefined;
  findCiudadByNombre(nombre: string): CiudadCatalogo | undefined;
  createCiudad(input: CreateCiudadInput): CiudadCatalogo;
  updateCiudad(id: string, input: UpdateCiudadInput): CiudadCatalogo | undefined;
  deleteCiudad(id: string): boolean;

  hydrate(aseguradoras: Aseguradora[], ciudades: CiudadCatalogo[]): void;
}

function slugId(prefix: string, nombre: string): string {
  const slug = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return `${prefix}-${slug || 'item'}-${Date.now().toString(36)}`;
}

export class InMemoryCatalogoRepository implements ICatalogoRepository {
  private aseguradoras: Aseguradora[] = structuredClone(ASEGURADORAS_SEED);
  private ciudades: CiudadCatalogo[] = structuredClone(CIUDADES_CATALOGO_SEED);

  hydrate(aseguradoras: Aseguradora[], ciudades: CiudadCatalogo[]): void {
    this.aseguradoras = structuredClone(aseguradoras);
    this.ciudades = structuredClone(ciudades);
  }

  listAseguradoras(soloActivas = true): Aseguradora[] {
    return this.aseguradoras
      .filter((a) => (soloActivas ? a.activa : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  findAseguradoraById(id: string): Aseguradora | undefined {
    return this.aseguradoras.find((a) => a.id === id);
  }

  findAseguradoraByNombre(nombre: string): Aseguradora | undefined {
    const n = nombre.trim().toLowerCase();
    return this.aseguradoras.find((a) => a.activa && a.nombre.toLowerCase() === n);
  }

  createAseguradora(input: CreateAseguradoraInput): Aseguradora {
    const row: Aseguradora = {
      id: slugId('aseg', input.nombre),
      nombre: input.nombre.trim(),
      nit: input.nit?.trim() || null,
      personaResponsable: input.personaResponsable?.trim() || null,
      contactoCobros: input.contactoCobros?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      activa: input.activa ?? true,
    };
    this.aseguradoras.push(row);
    persistAseguradora(row);
    return row;
  }

  updateAseguradora(id: string, input: UpdateAseguradoraInput): Aseguradora | undefined {
    const row = this.findAseguradoraById(id);
    if (!row) return undefined;
    if (input.nombre !== undefined) row.nombre = input.nombre.trim();
    if (input.nit !== undefined) row.nit = input.nit?.trim() || null;
    if (input.personaResponsable !== undefined) {
      row.personaResponsable = input.personaResponsable?.trim() || null;
    }
    if (input.contactoCobros !== undefined) {
      row.contactoCobros = input.contactoCobros?.trim() || null;
    }
    if (input.whatsapp !== undefined) row.whatsapp = input.whatsapp?.trim() || null;
    if (input.activa !== undefined) row.activa = input.activa;
    persistAseguradora(row);
    return row;
  }

  deleteAseguradora(id: string): boolean {
    const idx = this.aseguradoras.findIndex((a) => a.id === id);
    if (idx < 0) return false;
    this.aseguradoras.splice(idx, 1);
    persistDeleteAseguradora(id);
    return true;
  }

  listCiudades(soloActivas = true): CiudadCatalogo[] {
    return this.ciudades
      .filter((c) => (soloActivas ? c.activa : true))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  findCiudadById(id: string): CiudadCatalogo | undefined {
    return this.ciudades.find((c) => c.id === id);
  }

  findCiudadByNombre(nombre: string): CiudadCatalogo | undefined {
    const n = nombre.trim().toLowerCase();
    return this.ciudades.find((c) => c.activa && c.nombre.toLowerCase() === n);
  }

  createCiudad(input: CreateCiudadInput): CiudadCatalogo {
    const row: CiudadCatalogo = {
      id: slugId('ciudad', input.nombre),
      nombre: input.nombre.trim(),
      area: (input.area ?? 'bogota-area').trim() || 'bogota-area',
      activa: input.activa ?? true,
    };
    this.ciudades.push(row);
    persistCiudad(row);
    return row;
  }

  updateCiudad(id: string, input: UpdateCiudadInput): CiudadCatalogo | undefined {
    const row = this.findCiudadById(id);
    if (!row) return undefined;
    if (input.nombre !== undefined) row.nombre = input.nombre.trim();
    if (input.area !== undefined) row.area = input.area.trim() || row.area;
    if (input.activa !== undefined) row.activa = input.activa;
    persistCiudad(row);
    return row;
  }

  deleteCiudad(id: string): boolean {
    const idx = this.ciudades.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    this.ciudades.splice(idx, 1);
    persistDeleteCiudad(id);
    return true;
  }
}

export const catalogoRepository = new InMemoryCatalogoRepository();
