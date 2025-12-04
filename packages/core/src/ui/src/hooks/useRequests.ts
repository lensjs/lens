import { useCallback, useMemo, useState } from "react";
import type { OneRequest, PaginatorMeta, RequestTableRow } from "../types";
import useLensApi, { DEFAULT_META } from "./useLensApi";

const defaultRequest: OneRequest = {
  queries: [],
  cacheEntries: [],
  exceptions: [],
  request: {
    created_at: "",
    data: {
      body: {},
      createdAt: "",
      duration: "",
      headers: {},
      id: "",
      ip: "",
      method: "GET",
      path: "",
      response: {
        headers: {},
        json: {},
      },
      status: 0,
      user: null,
    },
    id: "",
    lens_entry_id: null,
    type: "request",
  },
};

export default function useRequests() {
  const [requests, setRequests] = useState<RequestTableRow[]>([]);
  const [request, setRequest] = useState<OneRequest>(defaultRequest);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PaginatorMeta>(DEFAULT_META);

  const { getAllRequests, getRequestById } = useLensApi();
  const fetchRequest = useCallback(
    async (id: string) => {
      setLoading(true);
      getRequestById(id)
        .then((res) => {
          setRequest({
            request: res.data!,
            queries: [],
            cacheEntries: [],
            exceptions: [],
          });
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getRequestById]
  );
  const fetchRequests = useCallback(
    async (page?: number) => {
      setLoading(true);
      getAllRequests(page)
        .then((res) => {
          setRequests(res.data!);
          setMeta(res.meta!);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [getAllRequests]
  );

  const loadMoreRequests = useMemo(
    () => ({
      initialData: requests,
      meta,
      loading,
      fetchRawPage: getAllRequests,
    }),
    [requests, meta, loading, getAllRequests]
  );

  return {
    loadMoreRequests,
    fetchRequests,
    fetchRequest,
    request,
  };
}
