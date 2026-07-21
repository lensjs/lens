import type { ApiResponse, PaginatorMeta } from "../types";

export interface UseLoadMoreOptions<T> {
  paginatedPage: {
    meta: PaginatorMeta;
    initialData: T[];
    loading: boolean;
    fetchRawPage: (
      cursor?: number | null,
      after?: number | null,
    ) => Promise<ApiResponse<T[]>>;
  };
}
