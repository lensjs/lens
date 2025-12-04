import { useCallback, useMemo, useState } from "react";
import type {
  ExceptionTableRow,
  OneException,
  PaginatorMeta,
} from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useExceptions() {
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
    [getExceptions],
  );
  const getItems = useCallback(
    async (page?: number) => {
      setLoading(true);
      await getExceptions(page ?? 1)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getExceptions],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: getExceptions,
    }),
    [items, meta, loading, getExceptions],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
