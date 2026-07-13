import bcrypt from 'bcryptjs';
import {
  findEmpresaBySlug,
  listEmpresas,
  upsertEmpresaInStore,
} from '../data/empresas.seed';
import { findUserByEmail, upsertUserInStore } from '../data/users.seed';
import { persistEmpresa, persistUser } from '../db/persist';
import { plantillaPdfRepository } from '../repositories/plantilla-pdf.repository';
import { AppError } from '../middlewares/error.middleware';
import type { Empresa } from '../types/empresa';
import type { User } from '../types/user';
import { titleCaseWords } from '../utils/text';

function slugify(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export interface CreateEmpresaInput {
  nombre: string;
  slug?: string;
  adminEmail: string;
  adminNombre: string;
  adminPassword: string;
}

export interface CreateEmpresaResult {
  empresa: Empresa;
  admin: { id: string; email: string; nombre: string; role: 'ADMIN' };
}

export class EmpresasService {
  list(): Empresa[] {
    return listEmpresas().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  async create(input: CreateEmpresaInput): Promise<CreateEmpresaResult> {
    const nombre = titleCaseWords(input.nombre ?? '');
    const adminEmail = input.adminEmail?.trim().toLowerCase();
    const adminNombre = titleCaseWords(input.adminNombre ?? '');
    const adminPassword = input.adminPassword ?? '';

    if (!nombre || nombre.length < 2) {
      throw new AppError(400, 'Nombre de empresa requerido');
    }
    if (!adminEmail || !adminEmail.includes('@')) {
      throw new AppError(400, 'Email del admin inválido');
    }
    if (!adminNombre || adminNombre.length < 2) {
      throw new AppError(400, 'Nombre del admin requerido');
    }
    if (adminPassword.length < 8) {
      throw new AppError(400, 'La clave del admin debe tener al menos 8 caracteres');
    }
    if (findUserByEmail(adminEmail)) {
      throw new AppError(409, 'Ya existe un usuario con ese email');
    }

    let slug = slugify(input.slug?.trim() || nombre);
    if (!slug) slug = `empresa-${Date.now().toString(36)}`;
    if (findEmpresaBySlug(slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const empresa: Empresa = {
      id: `emp-${slug}-${Date.now().toString(36)}`,
      nombre,
      slug,
    };

    const admin: User = {
      id: `usr-${slug}-admin-${Date.now().toString(36)}`,
      email: adminEmail,
      nombre: adminNombre,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      role: 'ADMIN',
      empresaId: empresa.id,
    };

    upsertEmpresaInStore(empresa);
    upsertUserInStore(admin);
    persistEmpresa(empresa);
    persistUser(admin);

    plantillaPdfRepository.upsert(empresa.id, null, {
      razonSocial: nombre,
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
      },
    };
  }
}

export const empresasService = new EmpresasService();
