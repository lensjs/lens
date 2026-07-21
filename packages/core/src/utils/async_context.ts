import { AsyncLocalStorage } from "async_hooks";
import { ExceptionWatcher } from "../watchers";
import { constructErrorObject } from "./exception";

type LensContext = {
  requestId: string;
};

export const lensContext = new AsyncLocalStorage<LensContext>();

/**
 * Read the current request id from the async context.
 *
 * Must be called synchronously within the request scope (e.g. at query-issue
 * time inside an ORM extension/hook) — NOT from a detached driver log/event
 * callback, where the async context is already lost.
 */
export const getCurrentRequestId = (): string | undefined =>
  lensContext.getStore()?.requestId;

export const handleUncaughExceptions = (logger: ExceptionWatcher) => {
  process.on("uncaughtExceptionMonitor", async (err) => {
    await logger.log({
      ...constructErrorObject(err),
      requestId: lensContext.getStore()?.requestId,
    });
  });

  process.on("uncaughtException", async (err) => {
    await logger.log({
      ...constructErrorObject(err),
      requestId: lensContext.getStore()?.requestId,
    });
  });
};
