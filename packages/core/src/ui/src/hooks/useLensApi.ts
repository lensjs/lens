import { useCallback } from "react";
import type {
  CacheTableRow,
  ExceptionTableRow,
  GenericLensEntry,
  OneCache,
  OneException,
  OneMail,
  OneQuery,
  QueryTableRow,
  RequestEntry,
  RequestTableRow,
  MailTableRow,
  HttpTableRow,
  OneHttp,
  EventTableRow,
  OneEvent,
  RedisTableRow,
  OneRedis,
  FcmTableRow,
  OneFcm,
} from "../types";
import { prepareApiUrl } from "../utils/api";
import { useConfig } from "../utils/context";
import { fetchJson, withQueryParams, DEFAULT_META } from "../utils/apiClient";

export { DEFAULT_META };

const useLensApi = () => {
  const config = useConfig();

  const getAllRequests = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<RequestTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.requests, { cursor, after })),
      );
    },
    [config.api.requests],
  );

  const getRequestById = useCallback(
    async (id: string) => {
      return fetchJson<GenericLensEntry<RequestEntry>>(
        prepareApiUrl(`${config.api.requests}/${id}`),
      );
    },
    [config.api.requests],
  );

  const getQueries = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<QueryTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.queries, { cursor, after })),
      );
    },
    [config.api.queries],
  );

  const getQueryById = useCallback(
    async (id: string) => {
      return fetchJson<OneQuery>(prepareApiUrl(`${config.api.queries}/${id}`));
    },
    [config.api.queries],
  );

  const getCacheEntries = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<CacheTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.cache, { cursor, after })),
      );
    },
    [config.api.cache],
  );

  const getCacheEntryById = useCallback(
    async (id: string) => {
      return fetchJson<OneCache>(prepareApiUrl(`${config.api.cache}/${id}`));
    },
    [config.api.cache],
  );

  const getExceptions = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<ExceptionTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.exceptions, { cursor, after })),
      );
    },
    [config.api.exceptions],
  );

  const getExceptionById = useCallback(
    async (id: string) => {
      return fetchJson<OneException>(
        prepareApiUrl(`${config.api.exceptions}/${id}`),
      );
    },
    [config.api.exceptions],
  );

  const getAllMail = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<MailTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.mail, { cursor, after })),
      );
    },
    [config.api.mail],
  );

  const getMailById = useCallback(
    async (id: string) => {
      return fetchJson<OneMail>(prepareApiUrl(`${config.api.mail}/${id}`));
    },
    [config.api.mail],
  );

  const getHttpEntries = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<HttpTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.http, { cursor, after })),
      );
    },
    [config.api.http],
  );

  const getHttpById = useCallback(
    async (id: string) => {
      return fetchJson<OneHttp>(prepareApiUrl(`${config.api.http}/${id}`));
    },
    [config.api.http],
  );

  const getEventEntries = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<EventTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.event, { cursor, after })),
      );
    },
    [config.api.event],
  );

  const getEventById = useCallback(
    async (id: string) => {
      return fetchJson<OneEvent>(prepareApiUrl(`${config.api.event}/${id}`));
    },
    [config.api.event],
  );

  const getRedisEntries = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<RedisTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.redis, { cursor, after })),
      );
    },
    [config.api.redis],
  );

  const getRedisById = useCallback(
    async (id: string) => {
      return fetchJson<OneRedis>(prepareApiUrl(`${config.api.redis}/${id}`));
    },
    [config.api.redis],
  );

  const getFcmEntries = useCallback(
    async (cursor?: number | null, after?: number | null) => {
      return fetchJson<FcmTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.fcm, { cursor, after })),
      );
    },
    [config.api.fcm],
  );

  const getFcmById = useCallback(
    async (id: string) => {
      return fetchJson<OneFcm>(prepareApiUrl(`${config.api.fcm}/${id}`));
    },
    [config.api.fcm],
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
    getHttpEntries,
    getHttpById,
    getEventEntries,
    getEventById,
    getRedisEntries,
    getRedisById,
    getFcmEntries,
    getFcmById,
  };
};

export default useLensApi;
