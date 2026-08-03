import {
  generateSpanId,
  lensUtils,
  WatcherTypeEnum,
  type LensTrace,
  type StoreSaveEntry,
} from "@lensjs/core";

const SPAN_KIND = { INTERNAL: 1, SERVER: 2, CLIENT: 3 } as const;
const STATUS_CODE = { UNSET: 0, OK: 1, ERROR: 2 } as const;

type OtelAttr = {
  key: string;
  value: { stringValue?: string; intValue?: number; boolValue?: boolean };
};

type OtelSpan = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: OtelAttr[];
  status?: { code: number };
};

function attr(key: string, value: unknown): OtelAttr | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return { key, value: { boolValue: value } };
  if (typeof value === "number" && Number.isInteger(value)) {
    return { key, value: { intValue: value } };
  }
  return { key, value: { stringValue: String(value) } };
}

function attrs(...pairs: Array<OtelAttr | null>): OtelAttr[] {
  return pairs.filter((a): a is OtelAttr => a !== null);
}

function truncate(value: unknown, max = 512): string {
  const str = typeof value === "string" ? value : String(value ?? "");
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

/** Nanosecond start/end strings from a captured `createdAt` + duration string. */
function timeRange(
  createdAt: unknown,
  duration: unknown,
): { start: string; end: string } {
  const parsed = typeof createdAt === "string" ? Date.parse(createdAt) : NaN;
  const baseMs = Number.isFinite(parsed) ? parsed : Date.now();
  const durationMs = lensUtils.parseDurationMs(
    duration as string | number | null | undefined,
  );
  const startNs = BigInt(Math.round(baseMs)) * 1_000_000n;
  const endNs = startNs + BigInt(Math.max(0, Math.round(durationMs * 1e6)));
  return { start: startNs.toString(), end: endNs.toString() };
}

function buildRootSpan(trace: LensTrace): OtelSpan {
  const data = (trace.request?.data ?? {}) as Record<string, any>;
  const method = String(data.method ?? "GET");
  const path = String(data.path ?? "");
  const status = typeof data.status === "number" ? data.status : undefined;
  const { start, end } = timeRange(data.createdAt, data.duration);

  return {
    traceId: trace.traceId,
    spanId: trace.rootSpanId,
    ...(trace.parentSpanId ? { parentSpanId: trace.parentSpanId } : {}),
    name: `${method} ${path}`.trim(),
    kind: SPAN_KIND.SERVER,
    startTimeUnixNano: start,
    endTimeUnixNano: end,
    attributes: attrs(
      attr("http.request.method", method),
      attr("url.path", path),
      attr("http.response.status_code", status),
    ),
    status: {
      code: status && status >= 500 ? STATUS_CODE.ERROR : STATUS_CODE.UNSET,
    },
  };
}

function buildChildSpan(trace: LensTrace, entry: StoreSaveEntry): OtelSpan {
  const data = (entry.data ?? {}) as Record<string, any>;
  const { start, end } = timeRange(data.createdAt, data.duration);

  let name: string = String(entry.type);
  let kind: number = SPAN_KIND.INTERNAL;
  let extra: Array<OtelAttr | null> = [];
  let statusCode: number | undefined;

  switch (entry.type) {
    case WatcherTypeEnum.QUERY:
      kind = SPAN_KIND.CLIENT;
      name = "db.query";
      extra = [
        attr("db.query.text", truncate(data.query)),
        attr("db.system", data.type),
      ];
      break;
    case WatcherTypeEnum.HTTP:
      kind = SPAN_KIND.CLIENT;
      name = `HTTP ${String(data.method ?? "GET")}`;
      extra = [
        attr("http.request.method", data.method),
        attr("url.full", data.url),
        attr("http.response.status_code", data.status),
      ];
      if (typeof data.status === "number" && data.status >= 400) {
        statusCode = STATUS_CODE.ERROR;
      }
      break;
    case WatcherTypeEnum.CACHE:
      kind = SPAN_KIND.CLIENT;
      name = `cache ${String(data.action ?? "")}`.trim();
      extra = [attr("cache.key", data.data?.key ?? data.key)];
      break;
    case WatcherTypeEnum.REDIS:
      kind = SPAN_KIND.CLIENT;
      name = `redis ${String(data.command ?? "")}`.trim();
      extra = [attr("db.system", "redis"), attr("db.operation", data.command)];
      break;
    case WatcherTypeEnum.EXCEPTION:
      name = `exception ${String(data.name ?? "")}`.trim();
      statusCode = STATUS_CODE.ERROR;
      extra = [
        attr("exception.type", data.name),
        attr("exception.message", truncate(data.message)),
      ];
      break;
    default:
      break;
  }

  return {
    traceId: trace.traceId,
    spanId: generateSpanId(),
    parentSpanId: trace.rootSpanId,
    name,
    kind,
    startTimeUnixNano: start,
    endTimeUnixNano: end,
    attributes: attrs(...extra),
    ...(statusCode != null ? { status: { code: statusCode } } : {}),
  };
}

/**
 * Reconstruct an OTLP/HTTP JSON `ExportTraceServiceRequest` from a completed
 * Lens trace: the request becomes a root SERVER span and each correlated entry
 * (query, http, cache, …) a CLIENT/INTERNAL child span under it.
 */
export function buildResourceSpans(
  trace: LensTrace,
  serviceName: string,
): Record<string, any> {
  const spans: OtelSpan[] = [];
  if (trace.request) spans.push(buildRootSpan(trace));
  for (const child of trace.children) spans.push(buildChildSpan(trace, child));

  return {
    resourceSpans: [
      {
        resource: { attributes: attrs(attr("service.name", serviceName)) },
        scopeSpans: [{ scope: { name: "@lensjs/otel" }, spans }],
      },
    ],
  };
}
