import { useCallback, useMemo, useState } from "react";
import type { LogTableRow, OneLog, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useLog(listParams?: Record<string, string>) {
  const [items, setItems] = useState<LogTableRow[]>([]);
  const [item, setItem] = useState<OneLog>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getLogEntries, getLogById } = useLensApi();

  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getLogById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getLogById],
  );

  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getLogEntries(cursor, null, listParams)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getLogEntries, listParams],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: (cursor?: number | null, after?: number | null) =>
        getLogEntries(cursor, after, listParams),
    }),
    [items, meta, loading, getLogEntries, listParams],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
