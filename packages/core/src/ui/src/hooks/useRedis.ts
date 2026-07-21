import { useCallback, useMemo, useState } from "react";
import type { RedisTableRow, OneRedis, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useRedis() {
  const [items, setItems] = useState<RedisTableRow[]>([]);
  const [item, setItem] = useState<OneRedis>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getRedisEntries, getRedisById } = useLensApi();

  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getRedisById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getRedisById],
  );

  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getRedisEntries(cursor)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getRedisEntries],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: getRedisEntries,
    }),
    [items, meta, loading, getRedisEntries],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
