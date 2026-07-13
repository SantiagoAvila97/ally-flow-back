import { AppError } from '../middlewares/error.middleware';
import { getCategoriasForEmpresa } from '../data/categorias.seed';
import {
  catalogoRepository,
  type CreateAseguradoraInput,
  type ICatalogoRepository,
  type UpdateAseguradoraInput,
} from '../repositories/catalogo.repository';
import type { Aseguradora, CatalogosPayload, CiudadCatalogo } from '../types/catalogo';
import type { PublicUser } from '../types/user';
import { requireTenantEmpresaId } from './tenant-scope';
import { titleCaseWords } from '../utils/text';

export class CatalogosService {
  constructor(private readonly repo: ICatalogoRepository = catalogoRepository) {}

  /** Todo lo que necesita el front para armar formularios. */
  getAll(user: PublicUser): CatalogosPayload {
    return {
      aseguradoras: this.repo.listAseguradoras(true),
      ciudades: this.repo.listCiudades(true),
      categoriasServicio: getCategoriasForEmpresa(requireTenantEmpresaId(user)),
    };
  }

  listAseguradoras(soloActivas = true): Aseguradora[] {
    return this.repo.listAseguradoras(soloActivas);
  }

  listCiudades(soloActivas = true): CiudadCatalogo[] {
    return this.repo.listCiudades(soloActivas);
  }

  isAseguradoraValida(nombre: string): boolean {
    return !!this.repo.findAseguradoraByNombre(nombre);
  }

  isCiudadValida(nombre: string): boolean {
    return !!this.repo.findCiudadByNombre(nombre);
  }

  createAseguradora(input: CreateAseguradoraInput): Aseguradora {
    const nombre = titleCaseWords(input.nombre ?? '');
    if (!nombre || nombre.length < 2) {
      throw new AppError(400, 'Nombre de aseguradora requerido');
    }
    const dup = this.repo
      .listAseguradoras(false)
      .find((a) => a.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) throw new AppError(409, 'Ya existe una aseguradora con ese nombre');
    return this.repo.createAseguradora({
      ...input,
      nombre,
      personaResponsable: input.personaResponsable
        ? titleCaseWords(input.personaResponsable)
        : input.personaResponsable,
    });
  }

  updateAseguradora(id: string, input: UpdateAseguradoraInput): Aseguradora {
    let next = { ...input };
    if (input.nombre !== undefined) {
      const nombre = titleCaseWords(input.nombre);
      if (nombre.length < 2) throw new AppError(400, 'Nombre inválido');
      const dup = this.repo
        .listAseguradoras(false)
        .find((a) => a.id !== id && a.nombre.toLowerCase() === nombre.toLowerCase());
      if (dup) throw new AppError(409, 'Ya existe una aseguradora con ese nombre');
      next = { ...next, nombre };
    }
    if (input.personaResponsable !== undefined && input.personaResponsable) {
      next = {
        ...next,
        personaResponsable: titleCaseWords(input.personaResponsable),
      };
    }
    const updated = this.repo.updateAseguradora(id, next);
    if (!updated) throw new AppError(404, 'Aseguradora no encontrada');
    return updated;
  }

  deleteAseguradora(id: string): void {
    if (!this.repo.deleteAseguradora(id)) {
      throw new AppError(404, 'Aseguradora no encontrada');
    }
  }
}

export const catalogosService = new CatalogosService();
