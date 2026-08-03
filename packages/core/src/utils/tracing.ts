import { randomBytes } from "node:crypto";
import { lensContext, type LensTraceContext } from "./async_context";
import { WatcherTypeEnum, type StoreSaveEntry } from "../types/index";

/** A completed request's trace, handed to the registered sink for export. */
export type LensTrace = {
  traceId: string;
  rootSpanId: string;
  parentSpanId?: string;
  sampled: boolean;
  /** The root request entry (if the request watcher captured it). */
  request?: StoreSaveEntry;
  /** Correlated child entries (queries, cache, http, …) for this request. */
  children: StoreSaveEntry[];
};

export type LensTraceSink = (trace: LensTrace) => void | Promise<void>;

let traceSink: LensTraceSink | null = null;

/**
 * Register the sink that turns completed request traces into exported spans
 * (e.g. `@lensjs/otel`). Registering it is what ENABLES trace collection — when
 * no sink is set, `createTraceContext` returns `undefined` and there is zero
 * overhead on the request path.
 */
export function setLensTraceSink(sink: LensTraceSink | null): void {
  traceSink = sink;
}

export function isTracingEnabled(): boolean {
  return traceSink !== null;
}

const ZERO_TRACE_ID = "0".repeat(32);
const ZERO_SPAN_ID = "0".repeat(16);
const TRACEPARENT_RE =
  /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

export function generateTraceId(): string {
  return randomBytes(16).toString("hex");
}

export function generateSpanId(): string {
  return randomBytes(8).toString("hex");
}

/** Parse a W3C `traceparent` header into its trace id, parent span id, and sampled flag. */
export function parseTraceparent(
  header?: string | null,
): { traceId: string; parentSpanId: string; sampled: boolean } | null {
  if (!header) return null;
  const match = TRACEPARENT_RE.exec(header.trim().toLowerCase());
  if (!match) return null;

  const traceId = match[2] as string;
  const parentSpanId = match[3] as string;
  const flags = match[4] as string;
  if (traceId === ZERO_TRACE_ID || parentSpanId === ZERO_SPAN_ID) return null;

  return { traceId, parentSpanId, sampled: (parseInt(flags, 16) & 1) === 1 };
}

/** Build a W3C `traceparent` header value. */
export function buildTraceparent(
  traceId: string,
  spanId: string,
  sampled = true,
): string {
  return `00-${traceId}-${spanId}-${sampled ? "01" : "00"}`;
}

/**
 * Create the trace context for a starting request. Joins an incoming
 * `traceparent` (reusing its trace id + span id as the parent) or starts a new
 * trace. Returns `undefined` when tracing is disabled (no sink registered).
 */
export function createTraceContext(
  traceparentHeader?: string | null,
): LensTraceContext | undefined {
  if (!traceSink) return undefined;

  const parent = parseTraceparent(traceparentHeader);
  return {
    traceId: parent?.traceId ?? generateTraceId(),
    rootSpanId: generateSpanId(),
    parentSpanId: parent?.parentSpanId,
    sampled: parent?.sampled ?? true,
    entries: [],
  };
}

/** Collect a captured entry onto the active request's trace (if any). */
export function recordTraceEntry(entry: StoreSaveEntry): void {
  lensContext.getStore()?.trace?.entries.push(entry);
}

/**
 * The `traceparent` to inject into outbound calls made during the current
 * request, so downstream services join this request's trace.
 */
export function getActiveTraceparent(): string | undefined {
  const trace = lensContext.getStore()?.trace;
  if (!trace) return undefined;
  return buildTraceparent(trace.traceId, trace.rootSpanId, trace.sampled);
}

/**
 * Hand the current request's collected trace to the registered sink (root
 * request entry + child entries). A no-op when tracing is disabled or no trace
 * context is active. Call after the request has been logged.
 */
export async function flushTrace(): Promise<void> {
  const trace = lensContext.getStore()?.trace;
  if (!trace || !traceSink) return;

  const entries = trace.entries;
  trace.entries = [];

  let request: StoreSaveEntry | undefined;
  const children: StoreSaveEntry[] = [];
  for (const entry of entries) {
    if (!request && entry.type === WatcherTypeEnum.REQUEST) {
      request = entry;
    } else {
      children.push(entry);
    }
  }

  try {
    await traceSink({
      traceId: trace.traceId,
      rootSpanId: trace.rootSpanId,
      parentSpanId: trace.parentSpanId,
      sampled: trace.sampled,
      request,
      children,
    });
  } catch (err) {
    console.error("Lens: trace export failed", err);
  }
}
