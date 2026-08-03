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
  LogTableRow,
  OneLog,
  JobTableRow,
  OneJob,
} from "../types";
import { prepareApiUrl } from "../utils/api";
import { useConfig } from "../utils/context";
import { fetchJson, withQueryParams, DEFAULT_META } from "../utils/apiClient";

export { DEFAULT_META };

const useLensApi = () => {
  const config = useConfig();

  const getAllRequests = useCallback(
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<RequestTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.requests, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<QueryTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.queries, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<CacheTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.cache, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<ExceptionTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.exceptions, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<MailTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.mail, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<HttpTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.http, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<EventTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.event, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<RedisTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.redis, { cursor, after, ...listParams })),
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
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<FcmTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.fcm, { cursor, after, ...listParams })),
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

  const getLogEntries = useCallback(
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<LogTableRow[]>(
        prepareApiUrl(withQueryParams(config.api.logs, { cursor, after, ...listParams })),
      );
    },
    [config.api.logs],
  );

  const getLogById = useCallback(
    async (id: string) => {
      return fetchJson<OneLog>(prepareApiUrl(`${config.api.logs}/${id}`));
    },
    [config.api.logs],
  );

  const getJobEntries = useCallback(
    async (
      cursor?: number | null,
      after?: number | null,
      listParams?: Record<string, string>,
    ) => {
      return fetchJson<JobTableRow[]>(
        prepareApiUrl(
          withQueryParams(config.api.jobs, { cursor, after, ...listParams }),
        ),
      );
    },
    [config.api.jobs],
  );

  const getJobById = useCallback(
    async (id: string) => {
      return fetchJson<OneJob>(
        prepareApiUrl(`${config.api.jobs}/${encodeURIComponent(id)}`),
      );
    },
    [config.api.jobs],
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
    getLogEntries,
    getLogById,
    getJobEntries,
    getJobById,
  };
};

export default useLensApi;
