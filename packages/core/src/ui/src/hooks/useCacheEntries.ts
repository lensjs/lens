import { useCallback, useMemo, useState } from "react";
import type { CacheTableRow, OneCache, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useCacheEntries() {
  const [items, setItems] = useState<CacheTableRow[]>([]);
  const [item, setItem] = useState<OneCache>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getCacheEntries, getCacheEntryById } = useLensApi();
  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getCacheEntryById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getCacheEntries],
  );
  const getItems = useCallback(
    async (page?: number) => {
      setLoading(true);
      await getCacheEntries(page ?? 1)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getCacheEntries],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: getCacheEntries,
    }),
    [items, meta, loading, getCacheEntries],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
