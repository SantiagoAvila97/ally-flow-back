import { PLANTILLAS_PDF_SEED } from '../data/plantillas-pdf.seed';
import type { PlantillaPdfCobro } from '../types/plantilla-pdf';

export class InMemoryPlantillaPdfRepository {
  private rows: PlantillaPdfCobro[] = structuredClone(PLANTILLAS_PDF_SEED);

  findByEmpresa(empresaId: string): PlantillaPdfCobro | undefined {
    return this.rows.find((r) => r.empresaId === empresaId);
  }

  upsert(empresaId: string, patch: Partial<PlantillaPdfCobro>): PlantillaPdfCobro {
    const idx = this.rows.findIndex((r) => r.empresaId === empresaId);
    const now = new Date().toISOString();
    if (idx === -1) {
      const created: PlantillaPdfCobro = {
        empresaId,
        razonSocial: patch.razonSocial ?? 'Empresa',
        nit: patch.nit ?? '',
        ciudad: patch.ciudad ?? '',
        telefono: patch.telefono ?? '',
        email: patch.email ?? '',
        colorAcento: patch.colorAcento ?? '#0f766e',
        textoHeader: patch.textoHeader ?? 'Documento de cobro',
        textoFooter: patch.textoFooter ?? '',
        tipoPlantilla: patch.tipoPlantilla ?? 'tabla_operativa',
        updatedAt: now,
      };
      this.rows.push(created);
      return created;
    }
    this.rows[idx] = {
      ...this.rows[idx],
      ...patch,
      empresaId,
      updatedAt: now,
    };
    return this.rows[idx];
  }
}

export const plantillaPdfRepository = new InMemoryPlantillaPdfRepository();
