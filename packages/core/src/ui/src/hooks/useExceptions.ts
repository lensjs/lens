import { useCallback, useMemo, useState } from "react";
import type {
  ExceptionTableRow,
  OneException,
  PaginatorMeta,
} from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useExceptions(listParams?: Record<string, string>) {
  const [items, setItems] = useState<ExceptionTableRow[]>([]);
  const [item, setItem] = useState<OneException>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getExceptions, getExceptionById } = useLensApi();
  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getExceptionById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getExceptionById],
  );
  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getExceptions(cursor, null, listParams)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getExceptions, listParams],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: (cursor?: number | null, after?: number | null) =>
        getExceptions(cursor, after, listParams),
    }),
    [items, meta, loading, getExceptions, listParams],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
