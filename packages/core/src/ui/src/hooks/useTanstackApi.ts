import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type {
  ApiResponse,
  OneRequest,
  PaginatorMeta,
  QueryEntry,
  QueryTableRow,
  RequestTableRow,
} from "../types";
import { prepareApiUrl } from "../utils/api";
import { useConfig } from "../utils/context";

export const DEFAULT_META: PaginatorMeta = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
};

async function fetchJson<TData>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<TData>> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url}`);
  }

  return res.json();
}

const withQueryParams = (
  endpoint: string,
  params?: Record<string, unknown>,
) => {
  const searchParams = new URLSearchParams(
    Object.entries(params || {}).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  return `${endpoint}${searchParams.toString() ? `?${searchParams}` : ""}`;
};

export function useAllRequests(
  page?: number,
  options?: UseQueryOptions<ApiResponse<RequestTableRow[]>>,
) {
  const config = useConfig();
  return useQuery<ApiResponse<RequestTableRow[]>>({
    queryKey: ["requests", page],
    queryFn: () =>
      fetchJson<RequestTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.requests, {
            page,
          }),
        ),
      ),
    ...options,
  });
}

export function useRequestById(
  id: string,
  options?: UseQueryOptions<ApiResponse<OneRequest>>,
) {
  const config = useConfig();
  return useQuery<ApiResponse<OneRequest>>({
    queryKey: ["request", id],
    queryFn: async () =>
      await fetchJson<OneRequest>(
        prepareApiUrl(`${config.api.requests}/${id}`),
      ),
    ...{
      enabled: !!id,
      ...options,
    },
  });
}

export function useQueries(
  page: number,
  options?: UseQueryOptions<ApiResponse<QueryTableRow[]>>,
) {
  const config = useConfig();
  return useQuery<ApiResponse<QueryTableRow[]>>({
    queryKey: ["queries", page],
    queryFn: () =>
      fetchJson<QueryTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.queries, {
            page,
          }),
        ),
      ),
    ...options,
  });
}

export function useQueryById(
  id: string,
  options?: UseQueryOptions<ApiResponse<QueryEntry>>,
) {
  const config = useConfig();
  return useQuery<ApiResponse<QueryEntry>>({
    queryKey: ["query", id],

    queryFn: () =>
      fetchJson<QueryEntry>(prepareApiUrl(`${config.api.queries}/${id}`)),
    ...{
      enabled: !!id,
      ...options,
    },
  });
}
