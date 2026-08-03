import { AsyncLocalStorage } from "async_hooks";
import type { ExceptionWatcher } from "../watchers";
import { constructErrorObject } from "./exception";
import type { StoreSaveEntry } from "../types/index";

/** Per-request sampling buffer: holds entries until the request outcome is known. */
export type LensSamplingState = {
  pending: boolean;
  keep: boolean;
  buffer: StoreSaveEntry[];
};

/**
 * Per-request trace context (W3C). IDs are minted at request start so outbound
 * `traceparent` propagation and the reconstructed spans share the same ids;
 * captured entries are collected here and turned into spans at request finish.
 */
export type LensTraceContext = {
  traceId: string;
  rootSpanId: string;
  parentSpanId?: string;
  sampled: boolean;
  entries: StoreSaveEntry[];
};

type LensContext = {
  requestId: string;
  sampling?: LensSamplingState;
  trace?: LensTraceContext;
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
