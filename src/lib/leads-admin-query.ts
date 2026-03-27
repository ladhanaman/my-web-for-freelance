const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
const MIN_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 100;

export interface AdminLeadFilters {
  page: number;
  pageSize: number;
}

export type AdminSearchParams = Record<string, string | string[] | undefined>;

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function clampPageSize(value: number): number {
  if (value < MIN_PAGE_SIZE) {
    return MIN_PAGE_SIZE;
  }

  if (value > MAX_PAGE_SIZE) {
    return MAX_PAGE_SIZE;
  }

  return value;
}

export function parseAdminLeadFilters(searchParams: AdminSearchParams): AdminLeadFilters {
  const page = parsePositiveInt(getSingleParam(searchParams.page), DEFAULT_PAGE);
  const pageSize = clampPageSize(
    parsePositiveInt(getSingleParam(searchParams.pageSize), DEFAULT_PAGE_SIZE)
  );

  return {
    page,
    pageSize,
  };
}

export function buildAdminHref(filters: Partial<AdminLeadFilters>): string {
  const params = new URLSearchParams();

  if (filters.page && filters.page > DEFAULT_PAGE) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize && filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}
