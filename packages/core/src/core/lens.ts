import type Store from "../abstracts/store";
import type Adapter from "../abstracts/adapter";
import Watcher from "./watcher";
import { ApiController } from "./api_controller";
import * as path from "node:path";
import type {
  LensConfig,
  RouteDefinitionHandler,
  WatcherTypeEnum,
} from "../types/index.ts";
import { getUiConfig } from "../context/context";
import Container from "../context/container";
import { QueuedSqliteStore } from "../stores/index";
import { getMeta } from "../utils/index";

export default class Lens {
  private static watchers: Map<WatcherTypeEnum, Watcher> = new Map();
  private static store: Store;
  private static adapter: Adapter;
  private static config: LensConfig;

  static watch(watcher: Watcher): typeof Lens {
    this.watchers.set(watcher.name, watcher);
    return this;
  }

  static setWatchers(watchers: Watcher[]): typeof Lens {
    this.watchers = new Map(watchers.map((watcher) => [watcher.name, watcher]));
    return this;
  }

  static async start(
    config: LensConfig = {
      path: "lens",
      appName: "Lens",
      enabled: true,
    },
  ) {
    if (!config.enabled) {
      return;
    }

    this.config = config;
    await this.bindContainerDeps();

    let adapter = this.getAdapter();

    adapter.setWatchers(Array.from(this.watchers.values())).setup();

    const { apiRoutes } = this.getRoutes({
      path: config.path,
    });

    adapter.registerRoutes(apiRoutes);

    const uiPath = this.getUiPath();

    adapter.serveUI(uiPath, config.path, getUiConfig());
  }

  static setStore(store: Store): typeof Lens {
    this.store = store;
    return this;
  }

  static async getStore(): Promise<Store> {
    return this.store ?? (await this.getDefaultStore());
  }

  static setAdapter(adapter: Adapter): typeof Lens {
    this.adapter = adapter;
    return this;
  }

  static getAdapter(): Adapter {
    if (!this.adapter) {
      throw new Error("No adapter has been set");
    }

    return this.adapter;
  }

  public static getUiPath() {
    const { __dirname } = getMeta(import.meta.url);

    return path.resolve(this.normalizeDirName(__dirname), "ui");
  }

  public static getRoutes({ path }: { path: string }) {
    const apiRoutes = [
      {
        method: "GET" as const,
        path: `/lens-config`,
        handler: () => ApiController.fetchUiConfig(),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/requests`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getRequests(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/requests/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getRequest(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/queries`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getQueries(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/queries/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getQuery(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/cache`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getCacheEntries(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/cache/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getCacheEntry(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/exceptions`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getExceptions(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/exceptions/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getException(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/mail`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getEmails(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/mail/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getEmail(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/event`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getEventEntries(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/event/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getEventEntry(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/http`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getHttpEntries(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/http/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getHttpEntry(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/redis`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getRedisEntries(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/redis/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getRedisEntry(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/fcm`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getFcmEntries(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/fcm/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getFcmEntry(data),
      },
      {
        method: "GET" as const,
        path: `/${path}/api/stream/poll`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getStream(data),
      },
      {
        method: "DELETE" as const,
        path: `/${path}/api/truncate`,
        handler: async () => await ApiController.truncate(),
      },
    ];

    return { apiRoutes };
  }

  private static async bindContainerDeps() {
    const dbStore = await this.getStore();
    Container.singleton("store", () => dbStore);
    Container.singleton("uiConfig", () => {
      return {
        appName: this.config.appName,
        path: `/${this.config.path}`,
        authRequired: !!this.config.authEnabled,
        api: {
          requests: `/${this.config.path}/api/requests`,
          queries: `/${this.config.path}/api/queries`,
          cache: `/${this.config.path}/api/cache`,
          exceptions: `/${this.config.path}/api/exceptions`,
          mail: `/${this.config.path}/api/mail`,
          http: `/${this.config.path}/api/http`,
          event: `/${this.config.path}/api/event`,
          redis: `/${this.config.path}/api/redis`,
          fcm: `/${this.config.path}/api/fcm`,
          stream: `/${this.config.path}/api/stream`,
          streamPoll: `/${this.config.path}/api/stream/poll`,
          truncate: `/${this.config.path}/api/truncate`,
          login: `/${this.config.path}/api/auth/login`,
        },
      };
    });
  }

  private static async getDefaultStore(): Promise<Store> {
    const store = new QueuedSqliteStore(this.config.storeQueueConfig);
    await store.initialize();

    return store;
  }

  private static normalizeDirName(path: string) {
    return path.replace(/(\/packages\/)[^/]+(?=\/dist)/, "$1core");
  }
}
