import type { ApiResponse, PaginatorMeta } from "../types";

export interface UseLoadMoreOptions<T> {
  paginatedPage: {
    meta: PaginatorMeta;
    initialData: T[];
    loading: boolean;
    fetchRawPage: (page: number) => Promise<ApiResponse<T[]>>;
  };
}
