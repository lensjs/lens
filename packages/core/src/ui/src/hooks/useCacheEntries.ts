import { useCallback, useMemo, useState } from "react";
import type { CacheTableRow, OneCache, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useCacheEntries(listParams?: Record<string, string>) {
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
    [getCacheEntryById],
  );
  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getCacheEntries(cursor, null, listParams)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getCacheEntries, listParams],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: (cursor?: number | null, after?: number | null) =>
        getCacheEntries(cursor, after, listParams),
    }),
    [items, meta, loading, getCacheEntries, listParams],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
