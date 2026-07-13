import { CASOS_SEED } from '../data/casos.seed';
import { persistCaso } from '../db/persist';
import type { Caso, HistorialCambio } from '../types/caso';

export interface ICasoRepository {
  findAll(): Caso[];
  findById(id: string): Caso | undefined;
  findByEmpresa(empresaId: string): Caso[];
  findByAsesor(asesorId: string): Caso[];
  findByTecnico(tecnicoId: string): Caso[];
  create(caso: Caso): Caso;
  update(id: string, patch: Partial<Caso>): Caso | undefined;
  addFoto(id: string, url: string): Caso | undefined;
  appendHistorial(id: string, cambio: HistorialCambio, extraPatch?: Partial<Caso>): Caso | undefined;
  hydrate(rows: Caso[]): void;
}

export class InMemoryCasoRepository implements ICasoRepository {
  private casos: Caso[] = structuredClone(CASOS_SEED);
  private seq = 100;

  hydrate(rows: Caso[]): void {
    this.casos = structuredClone(rows);
    this.seq = Math.max(100, rows.length + 50);
  }

  findAll(): Caso[] {
    return [...this.casos];
  }

  findById(id: string): Caso | undefined {
    return this.casos.find((c) => c.id === id);
  }

  findByEmpresa(empresaId: string): Caso[] {
    return this.casos.filter((c) => c.empresaId === empresaId);
  }

  findByAsesor(asesorId: string): Caso[] {
    return this.casos.filter((c) => c.asesorId === asesorId);
  }

  findByTecnico(tecnicoId: string): Caso[] {
    return this.casos.filter((c) => c.tecnicoId === tecnicoId);
  }

  create(caso: Caso): Caso {
    this.casos.unshift(caso);
    persistCaso(caso);
    return caso;
  }

  nextId(prefix = 'caso'): string {
    this.seq += 1;
    return `${prefix}-${this.seq}-${Date.now().toString(36)}`;
  }

  update(id: string, patch: Partial<Caso>): Caso | undefined {
    const idx = this.casos.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    this.casos[idx] = {
      ...this.casos[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    persistCaso(this.casos[idx]!);
    return this.casos[idx];
  }

  addFoto(id: string, url: string): Caso | undefined {
    const caso = this.findById(id);
    if (!caso) return undefined;
    return this.update(id, { fotos: [...caso.fotos, url] });
  }

  appendHistorial(
    id: string,
    cambio: HistorialCambio,
    extraPatch: Partial<Caso> = {},
  ): Caso | undefined {
    const caso = this.findById(id);
    if (!caso) return undefined;

    return this.update(id, {
      ...extraPatch,
      historialCambios: [...caso.historialCambios, cambio],
      estado: cambio.estado,
    });
  }

  deleteByEmpresa(empresaId: string): number {
    const before = this.casos.length;
    this.casos = this.casos.filter((c) => c.empresaId !== empresaId);
    return before - this.casos.length;
  }
}

export const casoRepository = new InMemoryCasoRepository();
