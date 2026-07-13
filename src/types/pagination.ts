export const PAGE_SIZE_DEFAULT = 50;
export const PAGE_SIZE_MAX = 50;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ListCasosQuery {
  page: number;
  pageSize: number;
  q?: string;
  estado?: string;
  categoria?: string;
  ciudad?: string;
  aseguradora?: string;
  /** comercial | nos-deben */
  vista?: string;
  sort?: string;
  sortDir?: 'asc' | 'desc';
}

export function parsePagination(
  raw: Record<string, unknown>,
): { page: number; pageSize: number } {
  const page = Math.max(1, Number(raw.page) || 1);
  let pageSize = Number(raw.pageSize) || PAGE_SIZE_DEFAULT;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = PAGE_SIZE_DEFAULT;
  pageSize = Math.min(PAGE_SIZE_MAX, Math.floor(pageSize));
  return { page, pageSize };
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    meta: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  };
}
