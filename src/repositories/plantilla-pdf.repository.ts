import { PLANTILLAS_PDF_SEED } from '../data/plantillas-pdf.seed';
import { persistDeletePlantilla, persistPlantilla } from '../db/persist';
import {
  EMPTY_PLANTILLA_EXTRAS,
  type PlantillaPdfCobro,
  type PlantillaPdfExtras,
  type TipoPlantillaPdf,
} from '../types/plantilla-pdf';

type BrandingPatch = Partial<{
  razonSocial: string;
  nit: string;
  ciudad: string;
  telefono: string;
  email: string;
  colorAcento: string;
  textoHeader: string;
  textoFooter: string;
  tipoPlantilla: TipoPlantillaPdf;
  extras: PlantillaPdfExtras;
}>;

export class InMemoryPlantillaPdfRepository {
  private rows: PlantillaPdfCobro[] = structuredClone(PLANTILLAS_PDF_SEED);

  hydrate(rows: PlantillaPdfCobro[]): void {
    this.rows = structuredClone(rows);
  }

  listByEmpresa(empresaId: string): PlantillaPdfCobro[] {
    return this.rows
      .filter((r) => r.empresaId === empresaId)
      .sort((a, b) => {
        if (a.aseguradoraId === null && b.aseguradoraId !== null) return -1;
        if (a.aseguradoraId !== null && b.aseguradoraId === null) return 1;
        return a.id.localeCompare(b.id);
      });
  }

  listAll(): PlantillaPdfCobro[] {
    return [...this.rows];
  }

  findById(id: string): PlantillaPdfCobro | undefined {
    return this.rows.find((r) => r.id === id);
  }

  findDefault(empresaId: string): PlantillaPdfCobro | undefined {
    return this.rows.find((r) => r.empresaId === empresaId && r.aseguradoraId === null);
  }

  findByAseguradora(
    empresaId: string,
    aseguradoraId: string,
  ): PlantillaPdfCobro | undefined {
    return this.rows.find(
      (r) => r.empresaId === empresaId && r.aseguradoraId === aseguradoraId,
    );
  }

  findByEmpresa(empresaId: string): PlantillaPdfCobro | undefined {
    return this.findDefault(empresaId) ?? this.rows.find((r) => r.empresaId === empresaId);
  }

  upsert(
    empresaId: string,
    aseguradoraId: string | null,
    patch: BrandingPatch,
  ): PlantillaPdfCobro {
    const idx = this.rows.findIndex(
      (r) =>
        r.empresaId === empresaId &&
        (aseguradoraId === null
          ? r.aseguradoraId === null
          : r.aseguradoraId === aseguradoraId),
    );
    const now = new Date().toISOString();
    if (idx === -1) {
      const created: PlantillaPdfCobro = {
        id: `pdf-${empresaId.slice(0, 8)}-${aseguradoraId ?? 'default'}-${Date.now().toString(36)}`,
        empresaId,
        aseguradoraId,
        razonSocial: patch.razonSocial ?? 'Empresa',
        nit: patch.nit ?? '',
        ciudad: patch.ciudad ?? '',
        telefono: patch.telefono ?? '',
        email: patch.email ?? '',
        colorAcento: patch.colorAcento ?? '#0f766e',
        textoHeader: patch.textoHeader ?? 'Factura para cobro',
        textoFooter: patch.textoFooter ?? '',
        tipoPlantilla: patch.tipoPlantilla ?? 'tabla_operativa',
        extras: patch.extras
          ? { ...EMPTY_PLANTILLA_EXTRAS, ...patch.extras }
          : { ...EMPTY_PLANTILLA_EXTRAS },
        updatedAt: now,
      };
      this.rows.push(created);
      persistPlantilla(created);
      return created;
    }
    const prev = this.rows[idx]!;
    this.rows[idx] = {
      ...prev,
      ...patch,
      extras: patch.extras
        ? { ...EMPTY_PLANTILLA_EXTRAS, ...prev.extras, ...patch.extras }
        : (prev.extras ?? { ...EMPTY_PLANTILLA_EXTRAS }),
      empresaId,
      aseguradoraId,
      updatedAt: now,
    };
    persistPlantilla(this.rows[idx]!);
    return this.rows[idx]!;
  }

  deleteOverride(id: string): boolean {
    const row = this.findById(id);
    if (!row || row.aseguradoraId === null) return false;
    this.rows = this.rows.filter((r) => r.id !== id);
    persistDeletePlantilla(id);
    return true;
  }

  deleteByEmpresa(empresaId: string): number {
    const removed = this.rows.filter((r) => r.empresaId === empresaId);
    this.rows = this.rows.filter((r) => r.empresaId !== empresaId);
    for (const r of removed) {
      persistDeletePlantilla(r.id);
    }
    return removed.length;
  }
}

export const plantillaPdfRepository = new InMemoryPlantillaPdfRepository();
