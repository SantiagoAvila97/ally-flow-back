import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import {
  findEmpresaById,
  findEmpresaBySlug,
  isProtectedEmpresa,
  listEmpresas,
  removeEmpresaFromStore,
  upsertEmpresaInStore,
} from '../data/empresas.seed';
import {
  findEmpresaOwner,
  findUserByEmail,
  findUserById,
  removeUsersByEmpresaFromStore,
  upsertUserInStore,
} from '../data/users.seed';
import { hasDatabase } from '../db/pool';
import {
  deleteEmpresaCascade,
  persistEmpresa,
  persistUser,
} from '../db/persist';
import { AppError } from '../middlewares/error.middleware';
import { catalogoRepository } from '../repositories/catalogo.repository';
import { casoRepository } from '../repositories/caso.repository';
import { costoRepository } from '../repositories/costo.repository';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import type { Empresa } from '../types/empresa';
import type { PublicUser, User } from '../types/user';
import { isSuperAdmin } from '../types/roles';
import { assertSquareLogoDataUrl } from '../utils/logo';
import { titleCaseWords } from '../utils/text';

/** "Santiago Avila S.A.S" → "santiago-avila-sas" */
export function slugifyEmpresa(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export interface CreateEmpresaInput {
  nombre: string;
  nit: string;
  adminEmail: string;
  adminNombre: string;
  adminPassword: string;
  logoDataUrl: string;
}

export interface EmpresaListItem extends Empresa {
  owner: { id: string; nombre: string; email: string } | null;
  protegida: boolean;
  canDelete: boolean;
}

export interface CreateEmpresaResult {
  empresa: Empresa;
  admin: {
    id: string;
    email: string;
    nombre: string;
    role: 'ADMIN';
    esOwner: true;
  };
  adminPassword: string;
}

function actorIsOwner(actor: PublicUser): boolean {
  if (isSuperAdmin(actor.role)) return false;
  if (actor.esOwner) return true;
  return Boolean(findUserById(actor.id)?.esOwner);
}

export class EmpresasService {
  list(): EmpresaListItem[] {
    const allowDelete = !env.isProdApp;
    return listEmpresas()
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((e) => {
        const owner = findEmpresaOwner(e.id);
        const protegida = isProtectedEmpresa(e.id);
        return {
          ...e,
          owner: owner
            ? { id: owner.id, nombre: owner.nombre, email: owner.email }
            : null,
          protegida,
          canDelete: allowDelete,
        };
      });
  }

  getMine(actor: PublicUser): Empresa {
    if (isSuperAdmin(actor.role) || !actor.empresaId) {
      throw new AppError(403, 'Sin empresa asignada');
    }
    const empresa = findEmpresaById(actor.empresaId);
    if (!empresa) throw new AppError(404, 'Empresa no encontrada');
    return empresa;
  }

  updateLogo(actor: PublicUser, logoRaw: string): Empresa {
    if (!actorIsOwner(actor)) {
      throw new AppError(403, 'Solo el OWNER puede cambiar el logo de la empresa');
    }
    const empresa = this.getMine(actor);
    const logoDataUrl = assertSquareLogoDataUrl(logoRaw);
    const next: Empresa = { ...empresa, logoDataUrl };
    upsertEmpresaInStore(next);
    persistEmpresa(next);
    return next;
  }

  async create(input: CreateEmpresaInput): Promise<CreateEmpresaResult> {
    const nombre = titleCaseWords(input.nombre ?? '');
    const nit = (input.nit ?? '').replace(/\s+/g, '').trim();
    const adminEmail = input.adminEmail?.trim().toLowerCase();
    const adminNombre = titleCaseWords(input.adminNombre ?? '');
    const adminPassword = input.adminPassword ?? '';
    const logoDataUrl = assertSquareLogoDataUrl(input.logoDataUrl ?? '');

    if (!nombre || nombre.length < 2) {
      throw new AppError(400, 'Nombre de empresa requerido');
    }
    if (!nit || nit.length < 5) {
      throw new AppError(400, 'NIT de la empresa requerido');
    }
    if (!adminEmail || !adminEmail.includes('@')) {
      throw new AppError(400, 'Email del OWNER inválido');
    }
    if (!adminNombre || adminNombre.length < 2) {
      throw new AppError(400, 'Nombre del OWNER requerido');
    }
    if (adminPassword.length < 8) {
      throw new AppError(400, 'La clave del OWNER debe tener al menos 8 caracteres');
    }
    if (findUserByEmail(adminEmail)) {
      throw new AppError(409, 'Ya existe un usuario con ese email');
    }

    let slug = slugifyEmpresa(nombre);
    if (!slug) slug = `empresa-${Date.now().toString(36)}`;
    if (findEmpresaBySlug(slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const empresa: Empresa = {
      id: `emp-${slug}-${Date.now().toString(36)}`,
      nombre,
      slug,
      nit,
      logoDataUrl,
    };

    const admin: User = {
      id: `usr-${slug}-owner-${Date.now().toString(36)}`,
      email: adminEmail,
      nombre: adminNombre,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: 'ADMIN',
      empresaId: empresa.id,
      activo: true,
      esOwner: true,
    };

    upsertEmpresaInStore(empresa);
    upsertUserInStore(admin);
    persistEmpresa(empresa);
    persistUser(admin);

    plantillaPdfRepository.upsert(empresa.id, null, {
      razonSocial: nombre,
      nit,
      email: adminEmail,
      textoFooter: `${nombre} — documento generado por Ally Flow.`,
      tipoPlantilla: 'tabla_operativa',
    });

    return {
      empresa,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        role: 'ADMIN',
        esOwner: true,
      },
      adminPassword,
    };
  }

  /** Solo QA/local — no PROD. */
  async delete(id: string): Promise<void> {
    if (env.isProdApp) {
      throw new AppError(403, 'No se pueden eliminar empresas en producción');
    }
    const empresa = findEmpresaById(id);
    if (!empresa) throw new AppError(404, 'Empresa no encontrada');

    if (hasDatabase()) {
      await deleteEmpresaCascade(id);
    }

    casoRepository.deleteByEmpresa(id);
    costoRepository.deleteByEmpresa(id);
    catalogoRepository.deleteAseguradorasByEmpresa(id);
    plantillaPdfRepository.deleteByEmpresa(id);
    removeUsersByEmpresaFromStore(id);
    removeEmpresaFromStore(id);
  }
}

export const empresasService = new EmpresasService();
