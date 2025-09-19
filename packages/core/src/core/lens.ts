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
import { BetterSqliteStore } from "../stores/index";
import { getMeta } from "../utils/index";

export default class Lens {
  private static watchers: Map<WatcherTypeEnum, Watcher> = new Map();
  private static store: Store;
  private static adapter: Adapter;

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
      basePath: "lens",
      appName: "Lens",
      enabled: true,
    },
  ) {
    if (!config.enabled) {
      return;
    }
    await this.bindContainerDeps(config);

    let adapter = this.getAdapter();

    adapter.setWatchers(Array.from(this.watchers.values())).setup();

    const { apiRoutes } = this.getRoutes({
      basePath: config.basePath,
    });

    adapter.registerRoutes(apiRoutes);

    const uiPath = this.getUiPath();

    adapter.serveUI(uiPath, config.basePath, getUiConfig());
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

  public static getRoutes({ basePath }: { basePath: string }) {
    const apiRoutes = [
      {
        method: "GET" as const,
        path: `/lens-config`,
        handler: () => ApiController.fetchUiConfig(),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/requests`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getRequests(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/requests/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getRequest(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/queries`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getQueries(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/queries/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getQuery(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/cache`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getCacheEntries(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/cache/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getCacheEntry(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/exceptions`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getExceptions(data),
      },
      {
        method: "GET" as const,
        path: `/${basePath}/api/exceptions/:id`,
        handler: async (data: RouteDefinitionHandler) =>
          await ApiController.getException(data),
      },
      {
        method: "DELETE" as const,
        path: `/${basePath}/api/truncate`,
        handler: async () => await ApiController.truncate(),
      },
    ];

    return { apiRoutes };
  }

  private static async bindContainerDeps(config: LensConfig) {
    const dbStore = await this.getStore();
    Container.singleton("store", () => dbStore);
    Container.singleton("uiConfig", () => {
      return {
        appName: config.appName,
        path: `/${config.basePath}`,
        api: {
          requests: `/${config.basePath}/api/requests`,
          queries: `/${config.basePath}/api/queries`,
          cache: `/${config.basePath}/api/cache`,
          exceptions: `/${config.basePath}/api/exceptions`,
          truncate: `/${config.basePath}/api/truncate`,
        },
      };
    });
  }

  private static async getDefaultStore(): Promise<Store> {
    const store = new BetterSqliteStore();
    await store.initialize();

    return store;
  }

  private static normalizeDirName(path: string) {
    return path.replace(/(\/packages\/)[^/]+(?=\/dist)/, "$1core");
  }
}
