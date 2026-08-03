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
  /**
   * Enable the live delta-poll feed. Off while an explicit sort is active
   * (offset pagination can't drive the newest-first live feed). Defaults to true.
   */
  live?: boolean;
}
