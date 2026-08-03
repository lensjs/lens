import {
  createSamplingState,
  finalizeSampling,
  lensContext,
  lensUtils,
  lensExceptionUtils,
  type HttpMethod,
  type RequestWatcher,
  type ExceptionWatcher,
} from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import type { NextRouteHandler, RequiredNextAdapterConfig } from "./types";
import {
  getIpFromRequest,
  headersToObject,
  readRequestBody,
  readResponseBody,
} from "./web";

/**
 * Build the `withLens()` wrapper. Wrapping a Route Handler correlates every
 * query/log/exception emitted during it to the request, and records the
 * request/response (redacted + purged) once it settles.
 */
export function createWithLens(opts: {
  requestWatcher?: RequestWatcher;
  exceptionWatcher?: ExceptionWatcher;
  config: RequiredNextAdapterConfig;
  shouldIgnorePath: (path: string) => boolean;
}) {
  const { requestWatcher, exceptionWatcher, config, shouldIgnorePath } = opts;

  return function withLens<TContext = unknown>(
    handler: NextRouteHandler<TContext>,
  ): NextRouteHandler<TContext> {
    return async (request, context) => {
      const url = new URL(request.url);

      if (!requestWatcher || shouldIgnorePath(url.pathname)) {
        return handler(request, context);
      }

      const reqWatcher = requestWatcher;
      const requestId =
        request.headers.get("x-lens-request-id") ??
        lensUtils.generateRandomUuid();
      // Clone up-front so we can read the body without consuming the handler's.
      const bodyClone = request.clone();
      const start = process.hrtime();

      const finalize = async (
        snapshot: Response | undefined,
        status: number,
      ) => {
        try {
          const elapsed = process.hrtime(start);
          const duration = lensUtils.prettyHrTime(elapsed);

          const payload = {
            request: {
              id: requestId,
              method: request.method as HttpMethod,
              duration,
              path: url.pathname + url.search,
              headers: headersToObject(request.headers),
              body: await readRequestBody(bodyClone),
              status,
              ip: config.getRequestIp?.(request) ?? getIpFromRequest(request),
              createdAt: nowISO(),
            },
            response: {
              json: snapshot ? await readResponseBody(snapshot) : null,
              headers: snapshot ? headersToObject(snapshot.headers) : {},
            },
            user: (await config.isAuthenticated?.(request))
              ? await config.getUser?.(request)
              : null,
          };

          await reqWatcher.log(payload, config.hiddenParams);
          await finalizeSampling(
            status,
            elapsed[0] * 1000 + elapsed[1] / 1e6,
            config.sampling,
          );
        } catch (err) {
          console.error("Error finalizing request log:", err);
        }
      };

      const samplingState = createSamplingState(config.sampling);
      const runContext: {
        requestId: string;
        sampling?: ReturnType<typeof createSamplingState>;
      } = { requestId };
      if (samplingState) runContext.sampling = samplingState;

      return lensContext.run(runContext, async () => {
        try {
          const response = await handler(request, context);

          let snapshot: Response | undefined;
          try {
            snapshot = response.clone();
          } catch {
            snapshot = undefined;
          }

          // fire-and-forget so we never delay the response
          void finalize(snapshot, response.status);
          return response;
        } catch (err) {
          if (exceptionWatcher) {
            await exceptionWatcher.log({
              ...lensExceptionUtils.constructErrorObject(err as Error),
              requestId,
            });
          }
          // Record the request as a 500 for the timeline, then rethrow so the
          // host app's error handling still runs.
          void finalize(undefined, 500);
          throw err;
        }
      });
    };
  };
}
