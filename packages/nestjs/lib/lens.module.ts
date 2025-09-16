import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  OnModuleInit,
  Provider,
} from "@nestjs/common";
import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  lensUtils,
  LensWatcher,
  QueryWatcher,
  RequestWatcher,
} from "@lensjs/core";
import { HttpAdapterHost, APP_INTERCEPTOR } from "@nestjs/core";
import { NestLensConfig, RequiredNestLensConfig } from "./types.js";
import NestLensAdapter from "./adapter.js";
import { LensMiddleware } from "./lens_middleware.js";
import { LensInterceptor } from "./lens.interceptor.js";
import { createDynamicController } from "./utils/route.js";

@Module({})
export class LensModule
  implements OnApplicationBootstrap, NestModule, OnModuleInit
{
  constructor(
    private readonly adapter: NestLensAdapter,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  static forRoot(config?: NestLensConfig): DynamicModule {
    const defaultConfig = {
      adapter: "express",
      appName: "Lens",
      enabled: true,
      path: "/lens",
      ignoredPaths: [],
      onlyPaths: [],
      requestWatcherEnabled: true,
      exceptionWatcherEnabled: true,
      cacheWatcherEnabled: false,
    };

    const mergedConfig = {
      ...defaultConfig,
      ...config,
    } as RequiredNestLensConfig;

    const watchers: LensWatcher[] = [];
    const defaultWatchers = [
      {
        enabled: mergedConfig.requestWatcherEnabled,
        watcher: new RequestWatcher(),
      },
      {
        enabled: mergedConfig.cacheWatcherEnabled,
        watcher: new CacheWatcher(),
      },
      {
        enabled: mergedConfig.queryWatcher?.enabled,
        watcher: new QueryWatcher(),
      },
      {
        enabled: mergedConfig.exceptionWatcherEnabled,
        watcher: new ExceptionWatcher(),
      },
    ];

    defaultWatchers.forEach((w) => {
      if (w.enabled) {
        watchers.push(w.watcher);
      }
    });

    const { ignoredPaths, normalizedPath } = lensUtils.prepareIgnoredPaths(
      mergedConfig.path,
      mergedConfig.ignoredPaths,
    );

    mergedConfig.path = normalizedPath;

    const lensAdapterProvider: Provider = {
      provide: NestLensAdapter,
      useFactory: (httpAdapterHost: HttpAdapterHost) => {
        return new NestLensAdapter()
          .setWatchers(watchers)
          .setConfig(mergedConfig)
          .setIgnoredPaths(ignoredPaths)
          .setHttpAdapter(httpAdapterHost.httpAdapter)
          .setOnlyPaths(mergedConfig.onlyPaths);
      },
      inject: [HttpAdapterHost],
    };

    const DynamicController = createDynamicController(
      Lens.getRoutes({ basePath: mergedConfig.path }).apiRoutes,
    );

    return {
      module: LensModule,
      controllers: [DynamicController],
      providers: [
        lensAdapterProvider,
        {
          provide: APP_INTERCEPTOR,
          useClass: LensInterceptor,
        },
      ],
      exports: [NestLensAdapter],
    };
  }

  async onApplicationBootstrap() {
    console.log("Bootstrapping LensModule...");

    const adapter = this.adapter;

    await Lens.setAdapter(adapter).setWatchers(adapter.getWatchers()).start({
      basePath: adapter.getConfig().path,
      enabled: adapter.getConfig().enabled,
      appName: adapter.getConfig().appName,
    });

    console.log("LensModule initialized");
  }

  configure(consumer: MiddlewareConsumer) {
    console.log("Configuring LensModule...");
    consumer.apply(LensMiddleware).forRoutes("*");
    console.log("LensModule configured");
  }

  public onModuleInit() {
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    this.adapter.registerUI(httpAdapter.getInstance());
  }
}
