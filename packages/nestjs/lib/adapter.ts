import { LensAdapter, RouteDefinition } from "@lensjs/core";

export default class NestLensAdapter extends LensAdapter {
  constructor() {
    super();
  }

  override setup(): void {
    // TODO: Implement setup logic
  }

  override registerRoutes(routes: RouteDefinition[]): void {
    // TODO: Implement registerRoutes logic
  }

  override serveUI(
    uiPath: string,
    spaRoute: string,
    _dataToInject: Record<string, any>,
  ): void {
    // TODO: Implement serveUI logic
  }
}
