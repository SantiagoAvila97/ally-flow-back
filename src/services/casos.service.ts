import { AppError } from '../middlewares/error.middleware';
import { getCategoriasForEmpresa } from '../data/categorias.seed';
import { findUserById, USERS_SEED } from '../data/users.seed';
import { casoRepository, type ICasoRepository } from '../repositories/caso.repository';
import type { Caso, CrearCasoInput, HistorialCambio, LineaCobro } from '../types/caso';
import { ESTADOS_OCULTOS_TECNICO } from '../types/caso';
import type { PublicUser } from '../types/user';

/** ~2MB de texto; cubre dataURL de foto/firma razonable. */
const MAX_MEDIA_CHARS = 2_000_000;
const DATA_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp);base64,/i;

function assertMediaPayload(raw: string, field: string): string {
  const value = raw.trim();
  if (!value) throw new AppError(400, `${field} requerida`);
  if (value.length > MAX_MEDIA_CHARS) {
    throw new AppError(400, `${field} demasiado grande (máx. ~2MB)`);
  }
  if (DATA_IMAGE_RE.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  throw new AppError(
    400,
    `${field}: usa una imagen (PNG/JPEG/WebP) o una URL http(s)`,
  );
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

  listForUser(user: PublicUser): Caso[] {
    const deEmpresa = this.repo.findByEmpresa(user.empresaId);

    switch (user.role) {
      case 'ADMIN':
      case 'ASESOR':
        // Ambos ven la bandeja completa de la empresa (colaboración).
        return deEmpresa;
      case 'TECNICO':
        // Ciclo comercial: no satura bandeja del técnico; detalle puede verse tras handoff.
        return deEmpresa.filter(
          (c) =>
            c.tecnicoId === user.id &&
            !ESTADOS_OCULTOS_TECNICO.includes(c.estado),
        );
      default:
        return [];
    }
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
    return getCategoriasForEmpresa(user.empresaId);
  }

  listTecnicos(user: PublicUser): PublicUser[] {
    return USERS_SEED.filter(
      (u) => u.empresaId === user.empresaId && u.role === 'TECNICO',
    ).map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      role: u.role,
      empresaId: u.empresaId,
      empresaNombre: user.empresaNombre,
    }));
  }

  create(input: CrearCasoInput, user: PublicUser): Caso {
    if (user.role !== 'ASESOR' && user.role !== 'ADMIN') {
      throw new AppError(403, 'Solo asesores o admin pueden crear casos');
    }

    const categorias = getCategoriasForEmpresa(user.empresaId);
    if (!categorias.includes(input.categoriaServicio)) {
      throw new AppError(400, `Categoría inválida. Use: ${categorias.join(', ')}`);
    }

    const now = new Date().toISOString();
    const id =
      typeof (this.repo as typeof casoRepository).nextId === 'function'
        ? (this.repo as typeof casoRepository).nextId(
            user.empresaId.includes('norte') ? 'caso-norte' : 'caso-full',
          )
        : `caso-${Date.now()}`;

    const asesorId =
      user.role === 'ASESOR'
        ? user.id
        : (USERS_SEED.find((u) => u.empresaId === user.empresaId && u.role === 'ASESOR')?.id ??
          user.id);

    const caso: Caso = {
      id,
      titulo: input.titulo.trim(),
      descripcion: (input.descripcion ?? input.observaciones ?? '').trim(),
      cliente: input.aseguradora.trim(),
      estado: 'PendienteAsignacion',
      empresaId: user.empresaId,
      asesorId,
      tecnicoId: null,
      numeroAseguradora: input.numeroAseguradora.trim(),
      aseguradora: input.aseguradora.trim(),
      titularNombre: input.titularNombre.trim(),
      titularTelefono: input.titularTelefono.trim(),
      direccion: input.direccion.trim(),
      ciudad: input.ciudad.trim(),
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
    if (user.role !== 'ADMIN' && user.role !== 'ASESOR') {
      throw new AppError(403, 'No puedes asignar técnicos');
    }

    const caso = this.getById(id, user);
    const asignables: Caso['estado'][] = [
      'PendienteAsignacion',
      'EnGarantia',
      'Asignado',
    ];
    if (!asignables.includes(caso.estado)) {
      throw new AppError(
        400,
        'Solo se asigna o reasigna en Pendiente asignación, En garantía o Asignado',
      );
    }

    const tecnico = findUserById(tecnicoId);
    if (!tecnico || tecnico.role !== 'TECNICO' || tecnico.empresaId !== user.empresaId) {
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
    if (user.role !== 'TECNICO' || caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede iniciar');
    }
    if (caso.estado !== 'Asignado') {
      throw new AppError(400, 'El caso debe estar Asignado para iniciar gestión');
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

    if (user.role !== 'TECNICO' || caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede subir fotos');
    }
    if (caso.estado !== 'EnGestion') {
      throw new AppError(400, 'Solo se suben fotos en EnGestion');
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

    if (user.role !== 'TECNICO' || caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede documentar');
    }
    if (caso.estado !== 'EnGestion') {
      throw new AppError(400, 'Solo se documenta en EnGestion');
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

    if (user.role !== 'TECNICO' || caso.tecnicoId !== user.id) {
      throw new AppError(403, 'Solo el técnico asignado puede cerrar');
    }
    if (caso.estado !== 'EnGestion') {
      throw new AppError(400, 'El caso debe estar EnGestion');
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
    this.assertAsesorAdmin(user);
    const caso = this.getById(id, user);
    if (caso.estado !== 'PendienteDocumentoCobro') {
      throw new AppError(400, 'Solo se editan líneas en PendienteDocumentoCobro');
    }
    if (caso.esGarantia) {
      throw new AppError(400, 'Los casos de garantía no tienen documento de cobro');
    }

    const normalized = lineas.map((l) => {
      if (!l.nombre?.trim()) throw new AppError(400, 'Cada línea necesita nombre');
      if (l.cantidad <= 0) throw new AppError(400, 'Cantidad debe ser > 0');
      if (l.precioUnitario < 0) throw new AppError(400, 'Precio inválido');
      return {
        itemCostoId: l.itemCostoId ?? null,
        nombre: l.nombre.trim(),
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
    this.assertAsesorAdmin(user);
    const caso = this.getById(id, user);
    if (caso.estado !== 'PendienteDocumentoCobro') {
      throw new AppError(400, 'El caso no está en PendienteDocumentoCobro');
    }
    const updated = this.repo.update(id, {
      documentoCobroGeneradoAt: new Date().toISOString(),
    });
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  enviarDocumento(id: string, user: PublicUser): Caso {
    this.assertAsesorAdmin(user);
    const caso = this.getById(id, user);
    if (caso.estado !== 'PendienteDocumentoCobro') {
      throw new AppError(400, 'Solo se envía desde PendienteDocumentoCobro');
    }
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
    this.assertAsesorAdmin(user);
    const caso = this.getById(id, user);
    if (caso.estado !== 'PendienteConfirmacionAsegurado') {
      throw new AppError(400, 'Solo se confirma desde PendienteConfirmacionAsegurado');
    }

    const updated = this.repo.appendHistorial(
      id,
      historial('PendienteRecepcionPago', user, 'Asegurado confirmó el documento'),
    );
    if (!updated) throw new AppError(404, 'Caso no encontrado');
    return updated;
  }

  cobrar(id: string, user: PublicUser): Caso {
    this.assertAsesorAdmin(user);

    const caso = this.getById(id, user);
    if (caso.estado !== 'PendienteRecepcionPago') {
      throw new AppError(400, 'Solo PendienteRecepcionPago puede marcarse cobrado');
    }
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
   * Reabre el caso por garantía (sin cobro).
   * Siempre pasa por EnGarantia; el asesor/admin asigna (o reasigna) técnico → Asignado.
   */
  abrirGarantia(id: string, user: PublicUser): Caso {
    if (user.role !== 'ADMIN' && user.role !== 'ASESOR') {
      throw new AppError(403, 'No puedes abrir garantía');
    }

    const caso = this.getById(id, user);
    if (caso.estado !== 'Cobrado' && caso.estado !== 'CerradoGarantia') {
      throw new AppError(400, 'Solo se abre garantía desde Cobrado o CerradoGarantia');
    }

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

  private assertAsesorAdmin(user: PublicUser): void {
    if (user.role !== 'ADMIN' && user.role !== 'ASESOR') {
      throw new AppError(403, 'Solo asesor o admin');
    }
  }

  private canView(caso: Caso, user: PublicUser): boolean {
    if (caso.empresaId !== user.empresaId) return false;
    if (user.role === 'ADMIN' || user.role === 'ASESOR') return true;
    if (user.role === 'TECNICO') {
      // Puede ver sus casos aunque ya pasaron a cobranza (handoff / historial).
      return caso.tecnicoId === user.id;
    }
    return false;
  }
}

export const casosService = new CasosService();
