import { useCallback, useMemo, useState } from "react";
import type { OneQuery, PaginatorMeta, QueryTableRow } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

export default function useQueries() {
  const [queries, setQueries] = useState<QueryTableRow[]>([]);
  const [query, setQuery] = useState<OneQuery>();
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getQueries, getQueryById } = useLensApi();
  const fetchQuery = useCallback(
    async (id: string) => {
      setLoading(true);
      getQueryById(id)
        .then((res) => {
          setQuery(res.data!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getQueries]
  );
  const fetchQueries = useCallback(
    async (page?: number) => {
      setLoading(true);
      await getQueries(page ?? 1)
        .then((res) => {
          setQueries(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getQueries]
  );

  const loadMoreRequests = useMemo(
    () => ({
      initialData: queries,
      meta,
      loading,
      fetchRawPage: getQueries,
    }),
    [queries, meta, loading, getQueries]
  );

  return {
    loadMoreRequests,
    fetchQueries,
    fetchQuery,
    queries,
    query,
  };
}
