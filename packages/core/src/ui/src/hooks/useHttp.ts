import { useCallback, useMemo, useState } from "react";
import type { HttpTableRow, OneHttp, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useHttp() {
  const [items, setItems] = useState<HttpTableRow[]>([]);
  const [item, setItem] = useState<OneHttp>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getHttpEntries, getHttpById } = useLensApi();

  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getHttpById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getHttpById],
  );

  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getHttpEntries(cursor)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getHttpEntries],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: getHttpEntries,
    }),
    [items, meta, loading, getHttpEntries],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
