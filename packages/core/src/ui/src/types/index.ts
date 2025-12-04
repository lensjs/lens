export type LensConfig = {
  appName: string;
  path: string;
  api: {
    requests: string;
    queries: string;
    cache: string;
    exceptions: string;
    truncate: string;
  };
};

export type LensEntryType = "request" | "query" | "cache";
export type LanguageTypeOption = "ts" | "dart";
export type PaginationParams = {
  page: number;
  perPage: number;
};

export type PaginatorMeta = {
  total: number;
  lastPage: number;
  currentPage: number;
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
};

export type RequestTableRow = GenericLensEntry<RequestTableEntry>;
export type OneRequest = {
  request: GenericLensEntry<RequestEntry>;
  queries: GenericLensEntry<QueryEntry>[];
  cacheEntries: GenericLensEntry<CacheEntry>[];
  exceptions: ExceptionTableRow[];
};
export type QueryTableRow = GenericLensEntry<QueryEntry>;
export type OneQuery = GenericLensEntry<QueryEntry>;
export type CacheTableRow = GenericLensEntry<CacheEntry>;
export type OneCache = GenericLensEntry<CacheEntry>;
export type ExceptionTableRow = GenericLensEntry<
  Pick<ExceptionEntry, "name" | "message" | "createdAt">
>;
export type OneException = GenericLensEntry<ExceptionEntry>;
export type QueryType = "sql" | "mongodb";
