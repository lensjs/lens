import { useCallback } from "react";
import type {
  ApiResponse,
  CacheTableRow,
  ExceptionTableRow,
  GenericLensEntry,
  OneCache,
  OneException,
  OneMail,
  OneQuery,
  PaginatorMeta,
  QueryTableRow,
  RequestEntry,
  RequestTableRow,
  MailTableRow,
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

  const fetchJson = useCallback(
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
    },
    [],
  );

  const withQueryParams = useCallback(
    (endpoint: string, params?: Record<string, unknown>) => {
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
    },
    [],
  );

  const getAllRequests = useCallback(
    async (page?: number) => {
      return fetchJson<RequestTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.requests, {
            page,
          }),
        ),
      );
    },
    [config.api.requests, fetchJson, withQueryParams],
  );

  const getRequestById = useCallback(
    async (id: string) => {
      return fetchJson<GenericLensEntry<RequestEntry>>(
        prepareApiUrl(`${config.api.requests}/${id}`),
      );
    },
    [config.api.requests, fetchJson],
  );

  const getQueries = useCallback(
    async (page: number) => {
      return fetchJson<QueryTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.queries, {
            page,
          }),
        ),
      );
    },
    [config.api.queries, fetchJson, withQueryParams],
  );

  const getQueryById = useCallback(
    async (id: string) => {
      return fetchJson<OneQuery>(prepareApiUrl(`${config.api.queries}/${id}`));
    },
    [config.api.queries, fetchJson],
  );

  const getCacheEntries = useCallback(
    async (page?: number) => {
      return fetchJson<CacheTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.cache, {
            page,
          }),
        ),
      );
    },
    [config.api.cache, fetchJson, withQueryParams],
  );

  const getCacheEntryById = useCallback(
    async (id: string) => {
      return fetchJson<OneCache>(prepareApiUrl(`${config.api.cache}/${id}`));
    },
    [config.api.cache, fetchJson],
  );

  const getExceptions = useCallback(
    async (page?: number) => {
      return fetchJson<ExceptionTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.exceptions, {
            page,
          }),
        ),
      );
    },
    [config.api.exceptions, fetchJson, withQueryParams],
  );

  const getExceptionById = useCallback(
    async (id: string) => {
      return fetchJson<OneException>(
        prepareApiUrl(`${config.api.exceptions}/${id}`),
      );
    },
    [config.api.exceptions, fetchJson],
  );

  const getAllMail = useCallback(
    async (page?: number) => {
      return fetchJson<MailTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.mail, {
            page,
          }),
        ),
      );
    },
    [config.api.mail, fetchJson, withQueryParams],
  );

  const getMailById = useCallback(
    async (id: string) => {
      return fetchJson<OneMail>(prepareApiUrl(`${config.api.mail}/${id}`));
    },
    [config.api.mail, fetchJson],
  );

  return {
    getAllRequests,
    getRequestById,
    getQueries,
    getQueryById,
    getCacheEntries,
    getCacheEntryById,
    getExceptions,
    getExceptionById,
    getAllMail,
    getMailById,
  };
};

export default useLensApi;
