import {
  DynamicModule,
  INestApplication,
  Module,
  OnApplicationBootstrap,
  Provider,
} from "@nestjs/common";
import {
  CacheWatcher,
  ExceptionWatcher,
  Lens,
  QueryWatcher,
  RequestWatcher,
  WatcherTypeEnum,
} from "@lensjs/core";
import { NestLensConfig } from "./define_config";
import { APP_FILTER, APP_INTERCEPTOR} from "@nestjs/core";

@Module({})
export class LensModule implements OnApplicationBootstrap {
  static forRoot(config: NestLensConfig): DynamicModule {
    const defaultConfig = {
      appName: "Lens",
      enabled: true,
      path: "/lens",
      ignoredPaths: [],
      onlyPaths: [],
      requestWatcherEnabled: true,
      cacheWatcherEnabled: false,
      exceptionWatcherEnabled: true,
    };

    const lensAdapterProvider: Provider = {
      provide: NestLensAdapter,
      useFactory: () => {
        const adapter = new NestLensAdapter()
          .setConfig(config)
          .setIgnoredPaths(config.ignoredPaths)
          .setOnlyPaths(config.onlyPaths);

        return adapter;
      },
    };

    return {
      module: LensModule,
      providers: [
        lensAdapterProvider,
        {
          provide: APP_FILTER,
          useClass: LensExceptionFilter,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: LensInterceptor,
        },
      ],
      exports: [NestLensAdapter],
    };
  }

  async onApplicationBootstrap() {
    const adapter = this.app.get(NestLensAdapter);

    await Lens.setAdapter(adapter).start({
      basePath: adapter.config.path,
      enabled: adapter.config.enabled,
      appName: adapter.config.appName,
    });

    // Apply the LensMiddleware globally
    this.app.use(new LensMiddleware().use);

    // Setup adapter specific logic
    adapter.setup();
  }
}
