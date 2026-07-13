import { EMPRESA_DEMO } from './empresas.seed';
import type { CategoriaCosto, ItemCosto } from '../types/costo';

const now = '2026-07-01T10:00:00.000Z';

type CatDef = { id: string; nombre: string; descripcion: string };
type ItemDef = {
  id: string;
  cat: string;
  nombre: string;
  descripcion: string;
  costo: number;
  precio: number;
  unidad: string;
};

/** Solo tenant DEMO: catálogo de ejemplo. Full y empresas nuevas parten vacías. */
const CAT_DEFS: CatDef[] = [
  {
    id: 'cat-plomeria',
    nombre: 'Plomería',
    descripcion: 'Tuberías, destapes, sifones y fugas',
  },
  {
    id: 'cat-electricidad',
    nombre: 'Electricidad',
    descripcion: 'Tomas, breakers, luminarias e instalaciones',
  },
];

const ITEM_DEFS: ItemDef[] = [
  {
    id: 'item-tub-12',
    cat: 'cat-plomeria',
    nombre: 'Tubería de 1/2"',
    descripcion: 'Suministro e instalación de tramo',
    costo: 62_000,
    precio: 110_000,
    unidad: 'metro',
  },
  {
    id: 'item-sifon',
    cat: 'cat-plomeria',
    nombre: 'Cambio de sifón',
    descripcion: 'Incluye retiro e instalación',
    costo: 38_000,
    precio: 75_000,
    unidad: 'und',
  },
  {
    id: 'item-destape',
    cat: 'cat-plomeria',
    nombre: 'Destape de desagüe',
    descripcion: 'Hasta 3 metros de recorrido',
    costo: 55_000,
    precio: 120_000,
    unidad: 'und',
  },
  {
    id: 'item-fuga',
    cat: 'cat-plomeria',
    nombre: 'Reparación de fuga',
    descripcion: 'Localización y sellado',
    costo: 70_000,
    precio: 145_000,
    unidad: 'servicio',
  },
  {
    id: 'item-toma',
    cat: 'cat-electricidad',
    nombre: 'Toma doble',
    descripcion: 'Suministro e instalación',
    costo: 28_000,
    precio: 55_000,
    unidad: 'und',
  },
  {
    id: 'item-breaker',
    cat: 'cat-electricidad',
    nombre: 'Cambio de breaker',
    descripcion: 'Revisión y reemplazo',
    costo: 45_000,
    precio: 90_000,
    unidad: 'und',
  },
  {
    id: 'item-luminaria',
    cat: 'cat-electricidad',
    nombre: 'Instalación luminaria LED',
    descripcion: 'Incluye conexión',
    costo: 52_000,
    precio: 105_000,
    unidad: 'und',
  },
  {
    id: 'item-tablero',
    cat: 'cat-electricidad',
    nombre: 'Revisión de tablero',
    descripcion: 'Inspección y ajuste de protecciones',
    costo: 80_000,
    precio: 160_000,
    unidad: 'servicio',
  },
];

function buildForEmpresa(
  empresaId: string,
  suffix: string,
): { categorias: CategoriaCosto[]; items: ItemCosto[] } {
  const categorias: CategoriaCosto[] = CAT_DEFS.map((c) => ({
    id: `${c.id}-${suffix}`,
    empresaId,
    nombre: c.nombre,
    descripcion: c.descripcion,
    createdAt: now,
    updatedAt: now,
  }));

  const items: ItemCosto[] = ITEM_DEFS.map((i) => ({
    id: `${i.id}-${suffix}`,
    empresaId,
    categoriaId: `${i.cat}-${suffix}`,
    nombre: i.nombre,
    descripcion: i.descripcion,
    costoInterno: i.costo,
    precioSugerido: i.precio,
    unidad: i.unidad,
    activo: true,
    createdAt: now,
    updatedAt: now,
  }));

  return { categorias, items };
}

const demo = buildForEmpresa(EMPRESA_DEMO, 'demo');

export const CATEGORIAS_COSTO_SEED: CategoriaCosto[] = [...demo.categorias];
export const ITEMS_COSTO_SEED: ItemCosto[] = [...demo.items];
