import { Inject, Injectable, NestMiddleware } from "@nestjs/common";
import { lensContext, lensUtils } from "@lensjs/core";
import NestLensAdapter from "./adapter";

@Injectable()
export class LensMiddleware implements NestMiddleware {
  constructor(
    @Inject(NestLensAdapter) private readonly adapter: NestLensAdapter,
  ) {}

  use(req: any, _: any, next: Function) {
    console.log("path", req.path);
    if (this.adapter.shouldIgnorePath(req.path)) {
      return next();
    }

    const requestId = lensUtils.generateRandomUuid();
    req.lensEntry = { requestId };

    lensContext.run({ requestId }, () => {
      console.log("[Http Request]: ", req.lensEntry.requestId);
      next();
    });
  }
}
