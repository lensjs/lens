import { useCallback, useMemo, useState } from "react";
import type { JobTableRow, OneJob, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useJob(listParams?: Record<string, string>) {
  const [items, setItems] = useState<JobTableRow[]>([]);
  const [item, setItem] = useState<OneJob>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getJobEntries, getJobById } = useLensApi();

  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getJobById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getJobById],
  );

  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getJobEntries(cursor, null, listParams)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getJobEntries, listParams],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: (cursor?: number | null, after?: number | null) =>
        getJobEntries(cursor, after, listParams),
    }),
    [items, meta, loading, getJobEntries, listParams],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
