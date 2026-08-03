import type Store from "../abstracts/store";
import {
  WatcherTypeEnum,
  type LensEntry,
  type PaginationParams,
  type Paginator,
} from "../types/index";
import {
  createLensMetrics,
  groupExceptions,
  type ExceptionGroupStat,
  type LensOverview,
} from "./metrics";

/** Max exception rows scanned when grouping a window into issues. */
const GROUP_ROW_CAP = 20_000;

type MinimalPaginator = Promise<Paginator<Omit<LensEntry, "data">[]>>;

/**
 * A single request together with every other signal correlated to it (queries,
 * cache operations, exceptions, emails, outbound HTTP, events, redis, fcm,
 * logs, jobs).
 */
export type RequestTimeline = {
  request: LensEntry;
  queries: LensEntry[];
  cacheEntries: LensEntry[];
  exceptions: LensEntry[];
  emails: LensEntry[];
  httpEntries: LensEntry[];
  eventEntries: LensEntry[];
  redisEntries: LensEntry[];
  fcmEntries: LensEntry[];
  logEntries: LensEntry[];
  jobEntries: LensEntry[];
};

/** Time window shared by the analytics reads. */
export type ReaderWindow = { from?: string; to?: string };

/**
 * Read-only view over a {@link Store}. This is the single source of truth for
 * reading captured entries and correlating a request to its signals; both the
 * `ApiController` (dashboard/API) and external consumers such as `@lensjs/mcp`
 * build on it so they never expose more than the dashboard already does.
 */
export interface LensReader {
  /**
   * Entries of one signal type, newest first. `pagination` carries the same
   * server-side search/filter/sort/date-range options the dashboard uses, so a
   * filter narrows the whole dataset rather than one page. Rows carry the
   * compact `minimal_data` unless `full` is true.
   */
  list(
    type: WatcherTypeEnum,
    pagination: PaginationParams,
    full?: boolean,
  ): Promise<Paginator<LensEntry[]>>;
  /** Newest entries across all watcher types (cursor/delta paginated). */
  latest(pagination: PaginationParams): MinimalPaginator;
  /** Full detail entry for any watcher type, or null when missing. */
  find(type: WatcherTypeEnum, id: string): Promise<LensEntry | null>;
  count(type: WatcherTypeEnum): Promise<number>;
  /** A request plus all signals sharing its `requestId`, or null when missing. */
  getRequestTimeline(id: string): Promise<RequestTimeline | null>;
  /** Aggregated health for a window: throughput, latency, errors, top offenders. */
  getOverview(window?: ReaderWindow): Promise<LensOverview>;
  /** Exceptions in a window collapsed into issues by fingerprint, most frequent first. */
  getExceptionGroups(
    window?: ReaderWindow & { limit?: number },
  ): Promise<ExceptionGroupStat[]>;
}

/**
 * Build a {@link LensReader} over the given store.
 */
export function createLensReader(store: Store): LensReader {
  const metrics = createLensMetrics(store);

  return {
    list(type, pagination, full = false) {
      return store.paginate<LensEntry[]>(type, pagination, full);
    },
    latest(pagination) {
      return store.latest<Omit<LensEntry, "data">[]>(pagination, false);
    },
    find(type, id) {
      return store.find(type, id);
    },
    count(type) {
      return store.count(type);
    },
    getOverview(window) {
      return metrics.getOverview(window);
    },
    async getExceptionGroups(window) {
      const page = await store.paginate<LensEntry[]>(
        WatcherTypeEnum.EXCEPTION,
        { ...window, perPage: GROUP_ROW_CAP },
        false,
      );

      return groupExceptions(page.data ?? [], window?.limit);
    },
    async getRequestTimeline(id) {
      const request = await store.find(WatcherTypeEnum.REQUEST, id);

      if (!request) {
        return null;
      }

      const queries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.QUERY,
      );
      const cacheEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.CACHE,
      );
      const exceptions = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.EXCEPTION,
        false,
      );
      const emails = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.MAIL,
        false,
      );
      const httpEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.HTTP,
      );
      const eventEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.EVENT,
      );
      const redisEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.REDIS,
      );
      const fcmEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.FCM,
      );
      const logEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.LOG,
      );
      const jobEntries = await store.allByRequestId(
        request.id,
        WatcherTypeEnum.JOB,
      );

      return {
        request,
        queries,
        cacheEntries,
        exceptions,
        emails,
        httpEntries,
        eventEntries,
        redisEntries,
        fcmEntries,
        logEntries,
        jobEntries,
      };
    },
  };
}
