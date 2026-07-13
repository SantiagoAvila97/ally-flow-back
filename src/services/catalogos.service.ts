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

  getAll(user: PublicUser): CatalogosPayload {
    const empresaId = requireTenantEmpresaId(user);
    return {
      aseguradoras: this.repo.listAseguradoras(empresaId, true),
      ciudades: this.repo.listCiudades(true),
      categoriasServicio: getCategoriasForEmpresa(empresaId),
    };
  }

  listAseguradoras(user: PublicUser, soloActivas = true): Aseguradora[] {
    return this.repo.listAseguradoras(requireTenantEmpresaId(user), soloActivas);
  }

  listCiudades(soloActivas = true): CiudadCatalogo[] {
    return this.repo.listCiudades(soloActivas);
  }

  isAseguradoraValida(user: PublicUser, nombre: string): boolean {
    return !!this.repo.findAseguradoraByNombre(
      requireTenantEmpresaId(user),
      nombre,
    );
  }

  isCiudadValida(nombre: string): boolean {
    return !!this.repo.findCiudadByNombre(nombre);
  }

  createAseguradora(
    user: PublicUser,
    input: Omit<CreateAseguradoraInput, 'empresaId'>,
  ): Aseguradora {
    const empresaId = requireTenantEmpresaId(user);
    const nombre = titleCaseWords(input.nombre ?? '');
    if (!nombre || nombre.length < 2) {
      throw new AppError(400, 'Nombre de cliente requerido');
    }
    const dup = this.repo
      .listAseguradoras(empresaId, false)
      .find((a) => a.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) throw new AppError(409, 'Ya existe un cliente con ese nombre');
    return this.repo.createAseguradora({
      ...input,
      empresaId,
      nombre,
      personaResponsable: input.personaResponsable
        ? titleCaseWords(input.personaResponsable)
        : input.personaResponsable,
    });
  }

  updateAseguradora(
    user: PublicUser,
    id: string,
    input: UpdateAseguradoraInput,
  ): Aseguradora {
    const empresaId = requireTenantEmpresaId(user);
    const existing = this.repo.findAseguradoraById(id);
    if (!existing || existing.empresaId !== empresaId) {
      throw new AppError(404, 'Cliente no encontrado');
    }
    let next = { ...input };
    if (input.nombre !== undefined) {
      const nombre = titleCaseWords(input.nombre);
      if (nombre.length < 2) throw new AppError(400, 'Nombre inválido');
      const dup = this.repo
        .listAseguradoras(empresaId, false)
        .find((a) => a.id !== id && a.nombre.toLowerCase() === nombre.toLowerCase());
      if (dup) throw new AppError(409, 'Ya existe un cliente con ese nombre');
      next = { ...next, nombre };
    }
    if (input.personaResponsable !== undefined && input.personaResponsable) {
      next = {
        ...next,
        personaResponsable: titleCaseWords(input.personaResponsable),
      };
    }
    const updated = this.repo.updateAseguradora(id, next);
    if (!updated) throw new AppError(404, 'Cliente no encontrado');
    return updated;
  }

  deleteAseguradora(user: PublicUser, id: string): void {
    const empresaId = requireTenantEmpresaId(user);
    const existing = this.repo.findAseguradoraById(id);
    if (!existing || existing.empresaId !== empresaId) {
      throw new AppError(404, 'Cliente no encontrado');
    }
    if (!this.repo.deleteAseguradora(id)) {
      throw new AppError(404, 'Cliente no encontrado');
    }
  }
}

export const catalogosService = new CatalogosService();
