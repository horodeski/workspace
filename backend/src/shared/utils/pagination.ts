export interface PaginationOptions {
  cursor?: string;
  limit: number; // default 20, max 100
  sort?: { field: string; order: 'asc' | 'desc' };
  filter?: Record<string, string>;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export function normalizePaginationOptions(
  options: Partial<PaginationOptions>
): PaginationOptions {
  return {
    cursor: options.cursor,
    limit: Math.min(Math.max(options.limit ?? 20, 1), 100),
    sort: options.sort,
    filter: options.filter,
  };
}
