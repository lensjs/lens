import { useCallback, useMemo, useState } from "react";
import type { FcmTableRow, OneFcm, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useFcm(listParams?: Record<string, string>) {
  const [items, setItems] = useState<FcmTableRow[]>([]);
  const [item, setItem] = useState<OneFcm>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getFcmEntries, getFcmById } = useLensApi();

  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getFcmById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getFcmById],
  );

  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getFcmEntries(cursor, null, listParams)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getFcmEntries, listParams],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: (cursor?: number | null, after?: number | null) =>
        getFcmEntries(cursor, after, listParams),
    }),
    [items, meta, loading, getFcmEntries, listParams],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
