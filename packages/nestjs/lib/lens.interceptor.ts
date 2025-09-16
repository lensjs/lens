import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { RequestEntry, lensUtils } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import NestLensAdapter from "./adapter";

@Injectable()
export class LensInterceptor implements NestInterceptor {
  constructor(
    @Inject(NestLensAdapter) private readonly adapter: NestLensAdapter,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<any>();
    const response = ctx.getResponse<any>();

    if (this.adapter.shouldIgnorePath(ctx.getRequest().url)) {
      return next.handle();
    }

    const startTime = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // duration in ms

        const requestId =
          request.lensEntry?.requestId || lensUtils.generateRandomUuid();

        const logPayload: RequestEntry = {
          request: {
            id: requestId,
            method: request.method,
            duration: `${duration.toFixed(2)} ms`,
            path: request.url,
            headers: request.headers,
            body: request.body,
            status: response.statusCode || response.status,
            ip: request.ip || "",
            createdAt: nowISO(),
          },
          response: {
            json: response._data || response.body,
            headers: response.getHeaders
              ? response.getHeaders()
              : response.headers,
          },
          user: null, // TODO: Implement getUserFromRequest in adapter
        };

        this.adapter.logRequest(logPayload);
      }),
    );
  }
}
