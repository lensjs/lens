import { FastifyInstance, FastifyRequest } from "fastify";
import { QueryWatcherHandler } from "@lensjs/watchers";
import { UserEntry } from "@lensjs/core";
import { SendOptions } from "@fastify/static";

export type FastifyAdapterConfig = {
  app: FastifyInstance;
  appName?: string;
  enabled?: boolean;
  path?: string;
  ignoredPaths?: RegExp[];
  onlyPaths?: RegExp[];
  requestWatcherEnabled?: boolean;
  cacheWatcherEnabled?: boolean;
  exceptionWatcherEnabled?: boolean;
  registerErrorHandler?: boolean;
  queryWatcher?: {
    enabled: boolean;
    handler: QueryWatcherHandler;
  };
  isAuthenticated?: (request: FastifyRequest) => Promise<boolean>;
  getUser?: (request: FastifyRequest) => Promise<UserEntry>;
};

export type RequiredFastifyAdapterConfig = Required<FastifyAdapterConfig> & {
  queryWatcher?: FastifyAdapterConfig["queryWatcher"];
  isAuthenticated?: FastifyAdapterConfig["isAuthenticated"];
  getUser?: FastifyAdapterConfig["getUser"];
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
