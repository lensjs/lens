import type {
  MailEntry,
  MailRawSource,
  Mailbox,
  MimePart,
  MailHeader,
} from "../../../types/mail";

export type LensConfig = {
  appName: string;
  path: string;
  authRequired?: boolean;
  api: {
    requests: string;
    queries: string;
    cache: string;
    exceptions: string;
    mail: string;
    http: string;
    event: string;
    redis: string;
    fcm: string;
    stream: string;
    streamPoll: string;
    truncate: string;
    login: string;
  };
};

export type LensEntryType =
  | "request"
  | "query"
  | "cache"
  | "exception"
  | "mail"
  | "http"
  | "event"
  | "redis"
  | "fcm";

export type EventEntry = {
  name: string;
  payload?: unknown;
  createdAt: string;
};

export type RedisEntry = {
  command: string;
  args?: string[];
  duration: string;
  status: "success" | "failed";
  error?: string;
  createdAt: string;
};

export type FcmRecipient = {
  target: string;
  success: boolean;
  messageId?: string;
  error?: string;
};

export type FcmEntry = {
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
  recipients?: FcmRecipient[];
  createdAt: string;
};

export type HttpEntry = {
  method: string;
  url: string;
  status?: number;
  duration: string;
  createdAt: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
};
export type LanguageTypeOption = "ts" | "dart";
export type PaginationParams = {
  page: number;
  perPage: number;
};

export type PaginatorMeta = {
  nextCursor: number | null;
  headCursor: number | null;
  hasMore: boolean;
  perPage: number;
};

export type Paginator<T> = {
  meta: PaginatorMeta;
  data: PaginatorData<T>;
};

export type PaginatorData<T> = T[];

export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T | null;
  meta?: Paginator<T>["meta"];
};

export type QueryEntry = {
  query: string;
  duration: string;
  createdAt: string;
  type: QueryType;
};

export type CacheAction = "hit" | "miss" | "delete" | "clear" | "write";
export type CacheEntry = {
  action: CacheAction;
  createdAt: string;
  data: {
    key: string;
    value: any;
  };
};

export type UserEntry = {
  id: number | string;
  name: string;
  email: string;
};

export type RequestEntry = {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  duration: string;
  path: string;
  headers: Record<string, string>;
  body: Record<string, any>;
  status: number;
  ip: string;
  createdAt: string;
  response: {
    json: Record<string, any>;
    headers: Record<string, string>;
  };
  user?: UserEntry | null;
};

export type RequestTableEntry = Omit<
  RequestEntry,
  "ip" | "headers" | "body" | "user"
>;
export type Queries = QueryEntry;
export type GenericLensEntry<T> = {
  id: string;
  type: LensEntryType;
  created_at: string;
  lens_entry_id: string | null;
  data: T;
};

/** A single entry as delivered by the live-tail stream (any watcher type). */
export type LiveEntry = GenericLensEntry<Record<string, any>>;

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

export type HasMoreType<T> = {
  data: T[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => Promise<void>;
  /** True once the live feed dropped entries between polls (high write volume). */
  hasGap: boolean;
};

export type RequestTableRow = GenericLensEntry<RequestTableEntry>;
export type OneRequest = {
  request: GenericLensEntry<RequestEntry>;
  queries: GenericLensEntry<QueryEntry>[];
  cacheEntries: GenericLensEntry<CacheEntry>[];
  exceptions: ExceptionTableRow[];
  emails: MailTableRow[];
  httpEntries: HttpTableRow[];
  eventEntries: EventTableRow[];
  redisEntries: RedisTableRow[];
  fcmEntries: FcmTableRow[];
};
export type QueryTableRow = GenericLensEntry<QueryEntry>;
export type OneQuery = GenericLensEntry<QueryEntry>;
export type CacheTableRow = GenericLensEntry<CacheEntry>;
export type OneCache = GenericLensEntry<CacheEntry>;
export type HttpTableRow = GenericLensEntry<HttpEntry>;
export type OneHttp = GenericLensEntry<HttpEntry>;
export type EventTableRow = GenericLensEntry<EventEntry>;
export type OneEvent = GenericLensEntry<EventEntry>;
export type RedisTableRow = GenericLensEntry<RedisEntry>;
export type OneRedis = GenericLensEntry<RedisEntry>;
export type FcmTableRow = GenericLensEntry<FcmEntry>;
export type OneFcm = GenericLensEntry<FcmEntry>;
export type ExceptionTableRow = GenericLensEntry<
  Pick<ExceptionEntry, "name" | "message" | "createdAt">
>;
export type OneException = GenericLensEntry<ExceptionEntry>;
export type MailTableRow = GenericLensEntry<
  Pick<MailEntry, "subject" | "date"> & { recipientsCount?: number }
>;
export type OneMail = GenericLensEntry<MailEntry>;
export type QueryType = "sql" | "mongodb";
export type { MailEntry, MailRawSource, Mailbox, MimePart, MailHeader };
