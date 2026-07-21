import { useCallback, useMemo, useState } from "react";
import type { EventTableRow, OneEvent, PaginatorMeta } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useEvent() {
  const [items, setItems] = useState<EventTableRow[]>([]);
  const [item, setItem] = useState<OneEvent>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getEventEntries, getEventById } = useLensApi();

  const getItem = useCallback(
    async (id: string) => {
      setLoading(true);
      getEventById(id)
        .then((res) => {
          setItem(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getEventById],
  );

  const getItems = useCallback(
    async (cursor?: number | null) => {
      setLoading(true);
      await getEventEntries(cursor)
        .then((res) => {
          setItems(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getEventEntries],
  );

  const loadMoreItems = useMemo(
    () => ({
      initialData: items,
      meta,
      loading,
      fetchRawPage: getEventEntries,
    }),
    [items, meta, loading, getEventEntries],
  );

  return {
    loadMoreItems,
    getItems,
    getItem,
    items,
    item,
  };
}
