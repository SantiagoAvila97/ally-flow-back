import { EMPRESA_FULL, EMPRESA_DEMO } from './empresas.seed';
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

const CAT_DEFS: CatDef[] = [
  {
    id: 'cat-hogar',
    nombre: 'Hogar',
    descripcion: 'Viviendas unifamiliares y casas',
  },
  {
    id: 'cat-apto',
    nombre: 'Apartamento',
    descripcion: 'Unidades en conjuntos y edificios',
  },
  {
    id: 'cat-oficina',
    nombre: 'Oficina',
    descripcion: 'Espacios administrativos y coworking',
  },
  {
    id: 'cat-local',
    nombre: 'Local comercial',
    descripcion: 'Locales, locales de comida y comercio',
  },
  {
    id: 'cat-glass',
    nombre: 'Glass',
    descripcion: 'Vidrios, templados y automotriz',
  },
];

const ITEM_DEFS: ItemDef[] = [
  // Hogar
  {
    id: 'item-tub-14',
    cat: 'cat-hogar',
    nombre: 'Tubería de 1/4"',
    descripcion: 'Suministro e instalación de tramo corto',
    costo: 45_000,
    precio: 85_000,
    unidad: 'metro',
  },
  {
    id: 'item-tub-12',
    cat: 'cat-hogar',
    nombre: 'Tubería de 1/2"',
    descripcion: 'PVC o cobre según disponibilidad',
    costo: 62_000,
    precio: 110_000,
    unidad: 'metro',
  },
  {
    id: 'item-sifon',
    cat: 'cat-hogar',
    nombre: 'Cambio de sifón',
    descripcion: 'Incluye retiro e instalación',
    costo: 38_000,
    precio: 75_000,
    unidad: 'und',
  },
  {
    id: 'item-destape',
    cat: 'cat-hogar',
    nombre: 'Destape de desagüe',
    descripcion: 'Hasta 3 metros de recorrido',
    costo: 55_000,
    precio: 120_000,
    unidad: 'servicio',
  },
  {
    id: 'item-llave',
    cat: 'cat-hogar',
    nombre: 'Cambio de llave de paso',
    descripcion: 'Válvula de control doméstica',
    costo: 42_000,
    precio: 90_000,
    unidad: 'und',
  },
  {
    id: 'item-cisterna',
    cat: 'cat-hogar',
    nombre: 'Reparación de cisterna',
    descripcion: 'Flotador, empaques o kit completo',
    costo: 70_000,
    precio: 145_000,
    unidad: 'servicio',
  },
  // Apartamento
  {
    id: 'item-calentador',
    cat: 'cat-apto',
    nombre: 'Instalación de calentador',
    descripcion: 'Gas o eléctrico (sin suministro del equipo)',
    costo: 180_000,
    precio: 320_000,
    unidad: 'servicio',
  },
  {
    id: 'item-griferia',
    cat: 'cat-apto',
    nombre: 'Cambio de grifería',
    descripcion: 'Lavamanos o cocina',
    costo: 65_000,
    precio: 130_000,
    unidad: 'und',
  },
  {
    id: 'item-sellado',
    cat: 'cat-apto',
    nombre: 'Sellado de ventanas',
    descripcion: 'Silicona estructural / intemperie',
    costo: 48_000,
    precio: 95_000,
    unidad: 'metro',
  },
  {
    id: 'item-puerta',
    cat: 'cat-apto',
    nombre: 'Reparación de puerta corrediza',
    descripcion: 'Ruedas, guía o ajuste de riel',
    costo: 95_000,
    precio: 180_000,
    unidad: 'servicio',
  },
  {
    id: 'item-filtracion',
    cat: 'cat-apto',
    nombre: 'Detección de filtración',
    descripcion: 'Diagnóstico sin demoliciones mayores',
    costo: 110_000,
    precio: 200_000,
    unidad: 'servicio',
  },
  // Oficina
  {
    id: 'item-ac',
    cat: 'cat-oficina',
    nombre: 'Mantenimiento de aire acondicionado',
    descripcion: 'Limpieza de filtros y revisión básica',
    costo: 85_000,
    precio: 160_000,
    unidad: 'und',
  },
  {
    id: 'item-punto-elec',
    cat: 'cat-oficina',
    nombre: 'Punto eléctrico nuevo',
    descripcion: 'Tomacorriente con canaleta vista',
    costo: 75_000,
    precio: 140_000,
    unidad: 'und',
  },
  {
    id: 'item-led',
    cat: 'cat-oficina',
    nombre: 'Cambio de luminaria LED',
    descripcion: 'Reemplazo e instalación',
    costo: 55_000,
    precio: 105_000,
    unidad: 'und',
  },
  {
    id: 'item-data',
    cat: 'cat-oficina',
    nombre: 'Punto de red / datos',
    descripcion: 'Cableado Cat6 hasta 15 m',
    costo: 90_000,
    precio: 170_000,
    unidad: 'und',
  },
  // Local comercial
  {
    id: 'item-grasa',
    cat: 'cat-local',
    nombre: 'Destape de trampa de grasas',
    descripcion: 'Limpieza y retiro de residuos',
    costo: 120_000,
    precio: 220_000,
    unidad: 'servicio',
  },
  {
    id: 'item-pvc',
    cat: 'cat-local',
    nombre: 'Reparación de tubería PVC',
    descripcion: 'Empalme o tramo dañado',
    costo: 80_000,
    precio: 155_000,
    unidad: 'servicio',
  },
  {
    id: 'item-valvula',
    cat: 'cat-local',
    nombre: 'Cambio de válvula de control',
    descripcion: 'Industrial liviana / comercial',
    costo: 95_000,
    precio: 185_000,
    unidad: 'und',
  },
  {
    id: 'item-piso',
    cat: 'cat-local',
    nombre: 'Reparación de piso húmedo',
    descripcion: 'Hasta 2 m² de reposición',
    costo: 140_000,
    precio: 260_000,
    unidad: 'servicio',
  },
  // Glass
  {
    id: 'item-templado',
    cat: 'cat-glass',
    nombre: 'Cambio de vidrio templado',
    descripcion: 'Medida estándar (sin diseño especial)',
    costo: 210_000,
    precio: 380_000,
    unidad: 'und',
  },
  {
    id: 'item-parabrisas',
    cat: 'cat-glass',
    nombre: 'Reposición de parabrisas',
    descripcion: 'Incluye sellado e instalación',
    costo: 280_000,
    precio: 490_000,
    unidad: 'und',
  },
  {
    id: 'item-polarizado',
    cat: 'cat-glass',
    nombre: 'Polarizado',
    descripcion: 'Por panel / lateral',
    costo: 95_000,
    precio: 175_000,
    unidad: 'und',
  },
  {
    id: 'item-espejo',
    cat: 'cat-glass',
    nombre: 'Cambio de espejo lateral',
    descripcion: 'Automotriz o baño según caso',
    costo: 70_000,
    precio: 135_000,
    unidad: 'und',
  },
];

function buildForEmpresa(empresaId: string, suffix: string): {
  categorias: CategoriaCosto[];
  items: ItemCosto[];
} {
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

const full = buildForEmpresa(EMPRESA_FULL, 'full');
const demo = buildForEmpresa(EMPRESA_DEMO, 'norte');

export const CATEGORIAS_COSTO_SEED: CategoriaCosto[] = [
  ...full.categorias,
  ...demo.categorias,
];

export const ITEMS_COSTO_SEED: ItemCosto[] = [...full.items, ...demo.items];
