import { SqlLanguage } from "sql-formatter";

export type QueryType = Required<SqlLanguage | "mongodb">;
export type SqlQueryType = Exclude<QueryType, "mongodb">;
export type QueryEntry = {
  data: {
    query: string;
    duration: string;
    createdAt: string;
    type: QueryType;
  };
  requestId?: string;
};

export type CacheAction = "miss" | "hit" | "delete" | "clear" | "write";
export type CacheEntry =
  | {
      action: "hit" | "write";
      requestId?: string;
      createdAt: string;
      data: {
        key: string;
        value: any;
      };
    }
  | {
      action: "clear";
      requestId?: string;
      createdAt: string;
      data?: undefined | {};
    }
  | {
      action: "delete" | "miss";
      requestId?: string;
      createdAt: string;
      data: {
        key: string;
      };
    };

export type ExceptionEntry = {
  name: string;
  message: string;
  cause?: Record<string, any> | string | null;
  trace?: string[];
  requestId?: string;
  createdAt: string;
  fileInfo?: {
    file: string;
    function: string;
  };
  codeFrame?: {
    file: string;
    line: number;
    column: number;
    context: {
      pre: string[];
      error: string;
      post: string[];
    };
  } | null;
  originalStack?: string | null;
};

export type UserEntry = {
  id: number | string;
  name: string;
  email: string;
};

export type RequestEntry = {
  request: {
    id: string;
    method: HttpMethod;
    duration: string;
    path: string;
    headers: Record<string, any>;
    body: Record<string, any>;
    status: number;
    ip: string;
    createdAt: string;
  };
  response: {
    json: Record<string, any>;
    headers: Record<string, string>;
  };
  user?: UserEntry | null;
};

export enum WatcherTypeEnum {
  REQUEST = "request",
  QUERY = "query",
  CACHE = "cache",
  EXCEPTION = "exception",
  MAIL = "mail",
  HTTP = "http",
  EVENT = "event",
  REDIS = "redis",
  FCM = "fcm",
  LOG = "log",
  JOB = "job",
}

export type JobStatus = "active" | "completed" | "failed";

export type JobEntry = {
  /** Stable per-job id (`${queue}:${jobId}`) — the same entry is upserted as the job progresses. */
  id: string;
  name: string;
  queue: string;
  status: JobStatus;
  attempts?: number;
  duration?: string;
  data?: any;
  result?: any;
  failedReason?: string;
  requestId?: string;
  createdAt: string;
};

export type LogLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export type LogEntry = {
  requestId?: string;
  createdAt: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  /** Which logger produced this entry (e.g. "console", "pino", "winston"). */
  source?: string;
};

export type EventEntry = {
  requestId?: string;
  createdAt: string;
  name: string;
  payload?: any;
};

export type HttpEntry = {
  requestId?: string;
  createdAt: string;
  method: string;
  url: string;
  status?: number;
  duration: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
};

export type RedisEntry = {
  requestId?: string;
  createdAt: string;
  command: string;
  args?: string[];
  duration: string;
  status: "success" | "failed";
  error?: string;
};

export type FcmRecipient = {
  /** The recipient token (truncated) / topic / condition. */
  target: string;
  success: boolean;
  messageId?: string;
  error?: string;
};

export type FcmEntry = {
  requestId?: string;
  createdAt: string;
  method: string;
  target?: string;
  title?: string;
  body?: string;
  data?: Record<string, string>;
  duration: string;
  status: "success" | "failed";
  successCount?: number;
  failureCount?: number;
  messageId?: string;
  error?: string;
  /** Per-recipient delivery results for batch sends (multicast / sendEach). */
  recipients?: FcmRecipient[];
};

export type LensConfig = {
  path: string;
  appName: string;
  enabled: boolean;
  /** Whether the dashboard is password-locked (surfaced to the UI). */
  authEnabled?: boolean;
  storeQueueConfig?: QueuedStoreConfig;
  hiddenParams?: {
    headers?: string[];
    bodyParams?: string[];
  };
};

/**
 * Password-lock configuration for the dashboard. Setting `password` enables the
 * lock; all other fields are optional and have safe defaults.
 */
export type LensAuthConfig = {
  /** The password required to unlock the dashboard. Enables the lock when set. */
  password: string;
  /** Optional signing secret; by default the signing key is derived from the password. */
  secret?: string;
  /** Token lifetime in seconds (default: 12 hours). */
  tokenTtl?: number;
  /** Max failed attempts per window before lockout (default: 5). */
  maxAttempts?: number;
  /** Rate-limit window in milliseconds (default: 60000). */
  windowMs?: number;
  /** Base lockout in milliseconds; doubles each lockout up to 1h (default: 60000). */
  lockoutMs?: number;
};

export type LensEntry = {
  id: string;
  minimal_data?: Record<string, any>;
  data: Record<string, any>;
  type: WatcherTypeEnum;
  created_at: string;
  lens_entry_id: string | null;
};

export type RouteDefinitionHandler = {
  params: Record<string, any>;
  qs?: Record<string, any>;
};
export type RouteDefinition = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  handler: (data: RouteDefinitionHandler) => any;
};

/** Comparison operator for a server-side list filter. */
export type FilterOp = "eq" | "ne" | "gt" | "gte" | "lt" | "lte";

/**
 * A single server-side filter applied to a `minimal_data` JSON field, e.g.
 * `{ field: "status", op: "gte", value: "200" }` ->
 * `json_extract(minimal_data,'$.status') >= 200`.
 */
export type ListFilter = {
  field: string;
  op: FilterOp;
  value: string;
};

export type PaginationParams = {
  /** Opaque cursor (row id) to fetch entries older than; omit for the newest page. */
  cursor?: number | null;
  /** Opaque cursor (row id) to fetch entries newer than (live delta polling). */
  after?: number | null;
  perPage: number;
  /** Substring search across the compact `minimal_data` payload. */
  q?: string;
  /** ISO-8601 lower bound (inclusive) on `created_at`. */
  from?: string;
  /** ISO-8601 upper bound (inclusive) on `created_at`. */
  to?: string;
  /** Field filters AND-ed against the query. */
  filters?: ListFilter[];
  /**
   * `minimal_data` key to sort by. Unset (or `"time"`) keeps the default
   * newest-first rowid ordering with cursor pagination + live tail; any other
   * key switches the query to offset-based ordering.
   */
  sort?: string;
  /** Sort direction for `sort` (default `desc`). */
  dir?: "asc" | "desc";
  /** Sort the `sort` field numerically (CAST to REAL) instead of as text. */
  numericSort?: boolean;
};

export type Paginator<T> = {
  meta: {
    /** Cursor to pass back as `cursor` to fetch the next (older) page; null when exhausted. */
    nextCursor: number | null;
    /** Newest row id in this response; seed/advance the live-feed `after` cursor. */
    headCursor: number | null;
    /** Older paging: more older rows exist. Delta paging: more new rows than `perPage` (a gap). */
    hasMore: boolean;
    perPage: number;
  };
  data: T;
};

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T | null;
  meta?: Paginator<T>["meta"];
};

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";
export type RouteHttpMethod = "get" | "post" | "put" | "delete" | "patch";
export type Constructor = new (...args: any[]) => any;

/**
 * Age-based retention: periodically purge entries older than a max age, per
 * signal type. Complements the size-based `dbMaxSizeGb`/`dbPruneSizeGb` pruning.
 */
export type LensRetentionConfig = {
  /** Fallback max age (ms) applied to any signal type without a `perType` override. */
  defaultMaxAgeMs?: number;
  /** Per-signal-type max age (ms), keyed by `WatcherTypeEnum` value. */
  perType?: Partial<Record<`${WatcherTypeEnum}`, number>>;
  /** How often the retention sweep runs (ms). Defaults to 300000 (5 minutes). */
  sweepIntervalMs?: number;
};

export interface QueuedStoreConfig {
  batchSize?: number;
  processIntervalMs?: number;
  warnThreshold?: number;
  preallocate?: boolean;
  dbMaxSizeGb?: number;
  dbPruneSizeGb?: number;
  /** Age-based retention policy (per signal type). */
  retention?: LensRetentionConfig;
}

export * from './mail'
