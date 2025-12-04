import { useEffect, useState } from "react";
import type { HasMoreType } from "../types";
import type { UseLoadMoreOptions } from "../interfaces";

export function useLoadMore<T>({
  paginatedPage,
}: UseLoadMoreOptions<T>): HasMoreType<T> {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);

  useEffect(() => {
    setLoading(paginatedPage.loading);
    setHasMore(paginatedPage.meta.currentPage < paginatedPage.meta.lastPage);
    setPage(1);

    if (!paginatedPage.loading) {
      setData(paginatedPage.initialData);
    }
  }, [
    paginatedPage.initialData,
    paginatedPage.loading,
    paginatedPage.meta.currentPage,
    paginatedPage.meta.lastPage
  ]);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const newPage = page + 1;
    const newData = await paginatedPage.fetchRawPage(newPage);

    setData((prev) => [...prev, ...newData!.data!]);
    setPage(newPage);

    if (!newData?.meta) {
      setHasMore(false);
    } else {
      setHasMore(newData.meta.currentPage < newData.meta.lastPage);
    }

    setLoading(false);
  };

  return { data, loading, hasMore, loadMore };
}
