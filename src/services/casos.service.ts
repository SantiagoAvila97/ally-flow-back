import { AppError } from '../middlewares/error.middleware';
import { getCategoriasForEmpresa } from '../data/categorias.seed';
import { findUserById, listUsersByEmpresa, USERS_SEED } from '../data/users.seed';
import { casoRepository, type ICasoRepository } from '../repositories/caso.repository';
import { catalogoRepository } from '../repositories/catalogo.repository';
import { catalogosService } from './catalogos.service';
import type { Caso, CrearCasoInput, EstadoCaso, HistorialCambio, LineaCobro } from '../types/caso';
import { ESTADOS_CASO, ESTADOS_OCULTOS_TECNICO } from '../types/caso';
import type { ListCasosQuery, PaginatedResult } from '../types/pagination';
import { paginate } from '../types/pagination';
import type { PublicUser } from '../types/user';
import { assertCasoAction } from '../types/caso-permissions';
import { permissionsForRole } from '../types/permissions';
import { requireTenantEmpresaId } from './tenant-scope';
import { titleCaseWords } from '../utils/text';

/** ~2.5MB de texto; foto/firma comprimidasy enviadas como dataURL. */
const MAX_MEDIA_CHARS = 2_500_000;
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp);base64,/i;

function assertMediaPayload(raw: string, field: string): string {
  const value = raw.trim();
  if (!value) throw new AppError(400, `${field} requerida`);
  if (value.length > MAX_MEDIA_CHARS) {
    throw new AppError(400, `${field} demasiado grande (máx. ~2.5MB). Usa una foto más liviana`);
  }
  if (DATA_IMAGE_RE.test(value)) return value;
  if (/^https?:\/\//i.test(value)) {
    throw new AppError(400, `${field}: no se permiten URLs. Sube la foto desde el dispositivo`);
  }
  throw new AppError(400, `${field}: solo se aceptan fotos PNG/JPEG/WebP`);
}

function historial(
  estado: Caso['estado'],
  user: PublicUser,
  nota?: string,
): HistorialCambio {
  return {
    fecha: new Date().toISOString(),
    estado,
    usuarioId: user.id,
    usuarioNombre: user.nombre,
    nota,
  };
}

export class CasosService {
  constructor(private readonly repo: ICasoRepository = casoRepository) {}

  /** Visibilidad por rol (sin paginar). */
  private visibleForUser(user: PublicUser): Caso[] {
    const deEmpresa = this.repo.findByEmpresa(requireTenantEmpresaId(user));

    switch (user.role) {
      case 'ADMIN':
      case 'ASESOR':
        return deEmpresa;
      case 'TECNICO':
        return deEmpresa.filter(
          (c) =>
            c.tecnicoId === user.id &&
            !ESTADOS_OCULTOS_TECNICO.includes(c.estado),
        );
      default:
        return [];
    }
  }

  /** @deprecated preferir listPaginated — mantiene compat si algo pide todo. */
  listForUser(user: PublicUser): Caso[] {
    return this.visibleForUser(user);
  }

  listPaginated(user: PublicUser, query: ListCasosQuery): PaginatedResult<Caso> {
    let items = this.visibleForUser(user);

    if (query.vista === 'comercial') {
      const comercial: EstadoCaso[] = [
        'PendienteDocumentoCobro',
        'PendienteConfirmacionAsegurado',
        'PendienteRecepcionPago',
      ];
      items = items.filter((c) => comercial.includes(c.estado));
    } else if (query.vista === 'nos-deben') {
      const nosDeben: EstadoCaso[] = [
        'PendienteConfirmacionAsegurado',
        'PendienteRecepcionPago',
      ];
      items = items.filter((c) => nosDeben.includes(c.estado));
    }

    if (query.estado && (ESTADOS_CASO as readonly string[]).includes(query.estado)) {
      items = items.filter((c) => c.estado === query.estado);
    }
    if (query.categoria) {
      items = items.filter((c) => c.categoriaServicio === query.categoria);
    }
    if (query.ciudad) {
      items = items.filter((c) => c.ciudad === query.ciudad);
    }
    if (query.aseguradora) {
      items = items.filter((c) => c.aseguradora === query.aseguradora);
    }

    const q = query.q?.trim().toLowerCase();
    if (q) {
      items = items.filter((c) => {
        const haystack = [
          c.titulo,
          c.numeroAseguradora,
          c.titularNombre,
          c.aseguradora,
          c.descripcion,
          c.ciudad,
          c.categoriaServicio,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    const sort = query.sort ?? 'updatedAt';
    const dir = query.sortDir === 'asc' ? 1 : -1;
    items = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case 'createdAt':
          cmp = Date.parse(a.createdAt) - Date.parse(b.createdAt);
          break;
        case 'titulo':
          cmp = a.titulo.localeCompare(b.titulo, 'es');
          break;
        case 'aseguradora':
          cmp = a.aseguradora.localeCompare(b.aseguradora, 'es');
          break;
        case 'estado':
          cmp = a.estado.localeCompare(b.estado, 'es');
          break;
        case 'tecnico':
          cmp = (a.tecnicoId ?? '').localeCompare(b.tecnicoId ?? '', 'es');
          break;
        case 'updatedAt':
        default:
          cmp = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
          break;
      }
      return cmp * dir;
    });

    return paginate(items, query.page, query.pageSize);
  }

  getById(id: string, user: PublicUser): Caso {
    const caso = this.repo.findById(id);
    if (!caso) throw new AppError(404, 'Caso no encontrado');
    if (!this.canView(caso, user)) {
      throw new AppError(403, 'No tienes acceso a este caso');
    }
    return caso;
  }

  getCategorias(user: PublicUser): string[] {
    return getCategoriasForEmpresa(requireTenantEmpresaId(user));
  }

  listTecnicos(user: PublicUser): PublicUser[] {
    const empresaId = requireTenantEmpresaId(user);
    return listUsersByEmpresa(empresaId)
      .filter((u) => u.role === 'TECNICO')
      .map((u) => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        role: u.role,
        empresaId: u.empresaId,
        empresaNombre: user.empresaNombre,
        permissions: permissionsForRole(u.role),
        esOwner: Boolean(u.esOwner),
      }));
  }

  create(input: CrearCasoInput, user: PublicUser): Caso {
    assertCasoAction(user, null, 'crear');

    const categorias = getCategoriasForEmpresa(requireTenantEmpresaId(user));
    if (categorias.length === 0) {
      throw new AppError(
        400,
        'Esta empresa aún no tiene categorías de servicio. El admin debe crearlas en Admin → Tarifas.',
      );
    }
    if (!categorias.includes(input.categoriaServicio)) {
      throw new AppError(400, `Categoría inválida. Use: ${categorias.join(', ')}`);
    }

    if (!catalogosService.isAseguradoraValida(user, input.aseguradora)) {
      throw new AppError(400, 'Cliente no válido. Elige uno del catálogo.');
    }

    if (!catalogosService.isCiudadValida(input.ciudad)) {
      throw new AppError(400, 'Ciudad no válida. Elige una del catálogo.');
    }

    const aseguradoraNombre =
      catalogoRepository.findAseguradoraByNombre(
        requireTenantEmpresaId(user),
        input.aseguradora,
      )?.nombre ?? input.aseguradora.trim();
    const ciudadNombre =
      catalogoRepository.findCiudadByNombre(input.ciudad)?.nombre ?? input.ciudad.trim();

    const now = new Date().toISOString();
    const id =
      typeof (this.repo as typeof casoRepository).nextId === 'function'
        ? (this.repo as typeof casoRepository).nextId(
            requireTenantEmpresaId(user).includes('demo') ? 'caso-demo' : 'caso-full',
          )
        : `caso-${Date.now()}`;

    const asesorId =
      user.role === 'ASESOR'
        ? user.id
        : (USERS_SEED.find((u) => u.empresaId === requireTenantEmpresaId(user) && u.role === 'ASESOR')?.id ??
          user.id);

    const caso: Caso = {
      id,
      titulo: titleCaseWords(input.titulo),
      descripcion: (input.descripcion ?? input.observaciones ?? '').trim(),
      cliente: aseguradoraNombre,
      estado: 'PendienteAsignacion',
      empresaId: requireTenantEmpresaId(user),
      asesorId,
      tecnicoId: null,
      numeroAseguradora: input.numeroAseguradora.trim(),
      aseguradora: aseguradoraNombre,
      titularNombre: titleCaseWords(input.titularNombre),
      titularTelefono: input.titularTelefono.trim(),
      direccion: titleCaseWords(input.direccion),
      ciudad: ciudadNombre,
      lat: input.lat ?? null,
      lon: input.lon ?? null,
      direccionNormalizada: (input.direccionNormalizada ?? '').trim() || null,
      categoriaServicio: input.categoriaServicio,
      observaciones: (input.observaciones ?? '').trim(),
      fotos: [],
      firmaAtendidoUrl: null,
      firmaTecnicoUrl: null,
      gestionadoAt: null,
      esGarantia: false,
      casoOrigenId: null,
      montoEstimado: null,
      lineasCobro: [],
      documentoCobroGeneradoAt: null,
      historialCambios: [
        historial('PendienteAsignacion', user, 'Caso creado tras llamada'),
      ],
      createdAt: now,
      updatedAt: now,
    };

    return this.repo.create(caso);
  }

  asignarTecnico(id: string, tecnicoId: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'asignar');

    const tecnico = findUserById(tecnicoId);
    if (!tecnico || tecnico.role !== 'TECNICO' || tecnico.empresaId !== requireTenantEmpresaId(user)) {
      throw new AppError(400, 'Técnico inválido para esta empresa');
    }

    const reasignacion = caso.estado === 'Asignado' || !!caso.tecnicoId;
    const updated = this.repo.appendHistorial(
      id,
      historial(
        'Asignado',
        user,
        reasignacion
          ? `Reasignado a ${tecnico.nombre}`
          : `Asignado a ${tecnico.nombre}`,
      ),
      { tecnicoId: tecnico.id },
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  iniciarGestion(id: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'iniciar');
    if (caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede iniciar');
    }

    const updated = this.repo.appendHistorial(
      id,
      historial('EnGestion', user, 'Técnico inició gestión'),
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  addFoto(id: string, url: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'fotos');
    if (caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede subir fotos');
    }
    if (!url.trim()) throw new AppError(400, 'URL de foto requerida');
    const media = assertMediaPayload(url, 'foto');

    const updated = this.repo.addFoto(id, media);
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  /**
   * Documenta avance de visita sin cerrar el caso (sigue EnGestion).
   */
  documentar(
    id: string,
    input: { nota: string; fotoUrl?: string },
    user: PublicUser,
  ): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'documentar');
    if (caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede documentar');
    }
    if (!input.nota.trim()) {
      throw new AppError(400, 'La nota de documentación es obligatoria');
    }

    let fotos = caso.fotos;
    if (input.fotoUrl?.trim()) {
      fotos = [...caso.fotos, assertMediaPayload(input.fotoUrl, 'foto')];
    }

    const updated = this.repo.appendHistorial(
      id,
      historial('EnGestion', user, `Documentación de visita: ${input.nota.trim()}`),
      { fotos },
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  completar(
    id: string,
    input: {
      tipoFirma: 'TECNICO' | 'ATENDIDO' | 'AMBAS';
      firmaTecnicoUrl?: string;
      firmaAtendidoUrl?: string;
    },
    user: PublicUser,
  ): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'completar');
    if (caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede cerrar');
    }
    if (caso.fotos.length < 1) {
      throw new AppError(400, 'Debes adjuntar al menos una foto de evidencia');
    }

    const firmaTecnico = input.firmaTecnicoUrl
      ? assertMediaPayload(input.firmaTecnicoUrl, 'firma técnico')
      : null;
    const firmaAtendido = input.firmaAtendidoUrl
      ? assertMediaPayload(input.firmaAtendidoUrl, 'firma atendido')
      : null;

    if (input.tipoFirma === 'TECNICO' && !firmaTecnico) {
      throw new AppError(400, 'Firma del técnico requerida');
    }
    if (input.tipoFirma === 'ATENDIDO' && !firmaAtendido) {
      throw new AppError(400, 'Firma del atendido requerida');
    }
    if (input.tipoFirma === 'AMBAS' && (!firmaTecnico || !firmaAtendido)) {
      throw new AppError(400, 'Se requieren firma del técnico y del atendido');
    }
    if (!firmaTecnico && !firmaAtendido) {
      throw new AppError(400, 'Debes capturar al menos una firma para cerrar');
    }

    const nextEstado = caso.esGarantia ? 'CerradoGarantia' : 'PendienteDocumentoCobro';
    const now = new Date().toISOString();
    const quien =
      input.tipoFirma === 'TECNICO'
        ? 'firma técnico'
        : input.tipoFirma === 'ATENDIDO'
          ? 'firma atendido'
          : 'firmas técnico + atendido';

    const updated = this.repo.appendHistorial(
      id,
      historial(
        nextEstado,
        user,
        caso.esGarantia
          ? `Garantía cerrada (${quien})`
          : `Caso cerrado — pendiente documento de cobro (${quien})`,
      ),
      {
        firmaTecnicoUrl: firmaTecnico,
        firmaAtendidoUrl: firmaAtendido,
        gestionadoAt: now,
      },
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  setLineasCobro(id: string, lineas: LineaCobro[], user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'lineas_cobro');
    if (caso.esGarantia) {
      throw new AppError(400, 'Los casos de garantía no tienen documento de cobro');
    }

    const normalized = lineas.map((l) => {
      if (!l.nombre?.trim()) throw new AppError(400, 'Cada línea necesita nombre');
      if (l.cantidad <= 0) throw new AppError(400, 'Cantidad debe ser > 0');
      if (l.precioUnitario < 0) throw new AppError(400, 'Precio inválido');
      return {
        itemCostoId: l.itemCostoId ?? null,
        nombre: titleCaseWords(l.nombre),
        unidad: (l.unidad || 'und').trim(),
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
      };
    });

    const montoEstimado = normalized.reduce(
      (sum, l) => sum + l.cantidad * l.precioUnitario,
      0,
    );

    const updated = this.repo.update(id, {
      lineasCobro: normalized,
      montoEstimado,
    });
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  marcarDocumentoGenerado(id: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'lineas_cobro');
    const updated = this.repo.update(id, {
      documentoCobroGeneradoAt: new Date().toISOString(),
    });
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  enviarDocumento(id: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'enviar_documento');
    if (!caso.lineasCobro?.length) {
      throw new AppError(400, 'Agrega al menos un ítem de cobro antes de enviar');
    }

    const updated = this.repo.appendHistorial(
      id,
      historial('PendienteConfirmacionAsegurado', user, 'Documento oficial enviado'),
      {
        documentoCobroGeneradoAt:
          caso.documentoCobroGeneradoAt ?? new Date().toISOString(),
      },
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  confirmarAsegurado(id: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'confirmar_asegurado');

    const updated = this.repo.appendHistorial(
      id,
      historial('PendienteRecepcionPago', user, 'Asegurado confirmó el documento'),
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  cobrar(id: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'cobrar');
    if (caso.esGarantia) {
      throw new AppError(400, 'Los casos de garantía no pasan por cobro');
    }

    const updated = this.repo.appendHistorial(
      id,
      historial('Cobrado', user, 'Pago recibido — marcado cobrado'),
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  /**
   * Reabre el caso por garantía (sin cobro). Solo ADMIN.
   */
  abrirGarantia(id: string, user: PublicUser): Caso {
    const caso = this.getById(id, user);
    assertCasoAction(user, caso.estado, 'garantia');

    const updated = this.repo.appendHistorial(
      id,
      historial(
        'EnGarantia',
        user,
        caso.tecnicoId
          ? 'Garantía abierta — confirma o reasigna técnico'
          : 'Garantía abierta — pendiente de asignar técnico',
      ),
      {
        esGarantia: true,
        casoOrigenId: caso.casoOrigenId ?? caso.id,
        fotos: [],
        firmaAtendidoUrl: null,
        firmaTecnicoUrl: null,
        gestionadoAt: null,
        lineasCobro: [],
        documentoCobroGeneradoAt: null,
        montoEstimado: null,
      },
    );

    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  private canView(caso: Caso, user: PublicUser): boolean {
    if (caso.empresaId !== requireTenantEmpresaId(user)) return false;
    if (user.role === 'ADMIN' || user.role === 'ASESOR') return true;
    if (user.role === 'TECNICO') {
      if (caso.tecnicoId !== user.id) return false;
      // Handoff: puede ver el detalle hasta PendingDocumentoCobro; no estados comerciales posteriores.
      if (
        ESTADOS_OCULTOS_TECNICO.includes(caso.estado) &&
        caso.estado !== 'PendienteDocumentoCobro'
      ) {
        return false;
      }
      return true;
    }
    return false;
  }
}

export const casosService = new CasosService();
