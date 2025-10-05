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

export type Entry =
  | { type: "query"; data: QueryEntry }
  | { type: "request"; data: RequestEntry };

export enum WatcherTypeEnum {
  REQUEST = "request",
  QUERY = "query",
  CACHE = "cache",
  EXCEPTION = "exception",
}

export type LensConfig = {
  path: string;
  appName: string;
  enabled: boolean;
  storeQueueConfig?: QueuedStoreConfig;
  hiddenParams?: {
    headers?: string[];
    bodyParams?: string[];
  };
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

export type PaginationParams = {
  page: number;
  perPage: number;
};

export type Paginator<T> = {
  meta: {
    total: number;
    lastPage: number;
    currentPage: number;
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

export interface QueuedStoreConfig {
  batchSize?: number;
  processIntervalMs?: number;
  warnThreshold?: number;
  preallocate?: boolean;
}
