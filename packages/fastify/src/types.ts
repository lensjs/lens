import type { FastifyInstance, FastifyRequest } from "fastify";
import type { QueryWatcherHandler } from "@lensjs/watchers";
import type { LensConfig, LensAuthConfig, UserEntry } from "@lensjs/core";
import type { SendOptions } from "@fastify/static";

export type FastifyAdapterConfig = {
  app: FastifyInstance;
  ignoredPaths?: RegExp[];
  onlyPaths?: RegExp[];
  requestWatcherEnabled?: boolean;
  cacheWatcherEnabled?: boolean;
  exceptionWatcherEnabled?: boolean;
  mailWatcherEnabled?: boolean;
  httpWatcherEnabled?: boolean;
  eventWatcherEnabled?: boolean;
  redisWatcherEnabled?: boolean;
  fcmWatcherEnabled?: boolean;
  registerErrorHandler?: boolean;
  queryWatcher?: {
    enabled: boolean;
    handler: QueryWatcherHandler;
  };
  isAuthenticated?: (request: FastifyRequest) => Promise<boolean>;
  getUser?: (request: FastifyRequest) => Promise<UserEntry>;
  getRequestIp?: (request: FastifyRequest) => string;
  /** Password-lock the dashboard. Setting `auth.password` enables it. */
  auth?: LensAuthConfig;
} & Partial<LensConfig>;

export type RequiredFastifyAdapterConfig = Required<FastifyAdapterConfig> & {
  queryWatcher?: FastifyAdapterConfig["queryWatcher"];
  isAuthenticated?: FastifyAdapterConfig["isAuthenticated"];
  getUser?: FastifyAdapterConfig["getUser"];
  getRequestIp?: (request: FastifyRequest) => string;
  auth?: FastifyAdapterConfig["auth"];
};

declare module "fastify" {
  interface FastifyReply {
    sendFile(filename: string, rootPath?: string): FastifyReply;
    sendFile(filename: string, options?: SendOptions): FastifyReply;
    sendFile(
      filename: string,
      rootPath?: string,
      options?: SendOptions,
    ): FastifyReply;
    download(filepath: string, options?: SendOptions): FastifyReply;
    download(filepath: string, filename?: string): FastifyReply;
    download(
      filepath: string,
      filename?: string,
      options?: SendOptions,
    ): FastifyReply;
  }
}
