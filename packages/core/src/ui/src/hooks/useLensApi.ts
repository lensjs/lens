import type {
  ApiResponse,
  CacheTableRow,
  ExceptionTableRow,
  GenericLensEntry,
  OneCache,
  OneException,
  OneQuery,
  PaginatorMeta,
  QueryTableRow,
  RequestEntry,
  RequestTableRow,
} from "../types";
import { prepareApiUrl } from "../utils/api";
import { useConfig } from "../utils/context";

export const DEFAULT_META: PaginatorMeta = {
  currentPage: 1,
  lastPage: 1,
  total: 0,
};

const useLensApi = () => {
  const config = useConfig();

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

  const getAllRequests = async (page?: number) => {
    return fetchJson<RequestTableRow[]>(
      prepareApiUrl(
        withQueryParams(config.api.requests, {
          page,
        }),
      ),
    );
  };

  const getRequestById = async (id: string) => {
    return fetchJson<GenericLensEntry<RequestEntry>>(
      prepareApiUrl(`${config.api.requests}/${id}`),
    );
  };
  const getQueries = async (page: number) => {
    return fetchJson<QueryTableRow[]>(
      prepareApiUrl(
        withQueryParams(config.api.queries, {
          page,
        }),
      ),
    );
  };

  const getQueryById = async (id: string) => {
    return fetchJson<OneQuery>(prepareApiUrl(`${config.api.queries}/${id}`));
  };

  const getCacheEntries = async (page?: number) => {
    return fetchJson<CacheTableRow[]>(
      prepareApiUrl(
        withQueryParams(config.api.cache, {
          page,
        }),
      ),
    );
  };

  const getCacheEntryById = async (id: string) => {
    return fetchJson<OneCache>(prepareApiUrl(`${config.api.cache}/${id}`));
  };

  const getExceptions = async (page?: number) => {
    return fetchJson<ExceptionTableRow[]>(
      prepareApiUrl(
        withQueryParams(config.api.exceptions, {
          page,
        }),
      ),
    );
  };

  const getExceptionById = async (id: string) => {
    return fetchJson<OneException>(
      prepareApiUrl(`${config.api.exceptions}/${id}`),
    );
  };

  return {
    getAllRequests,
    getRequestById,
    getQueries,
    getQueryById,
    getCacheEntries,
    getCacheEntryById,
    getExceptions,
    getExceptionById,
  };
};

export default useLensApi;
