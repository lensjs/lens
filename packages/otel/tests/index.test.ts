import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createTraceContext,
  flushTrace,
  lensContext,
  setLensTraceSink,
  WatcherTypeEnum,
} from "@lensjs/core";
import { createLensOtel } from "../src";

const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));

/** Run a request that captures one query, then flush its trace to the sink. */
async function emitTrace(): Promise<void> {
  const trace = createTraceContext();
  await lensContext.run({ requestId: "req-1", trace }, async () => {
    trace?.entries.push(
      {
        type: WatcherTypeEnum.REQUEST,
        data: { method: "GET", path: "/users", status: 200 },
      },
      { type: WatcherTypeEnum.QUERY, data: { query: "select 1" } },
    );
    await flushTrace();
  });
}

const lastBody = () => JSON.parse(fetchMock.mock.calls[0]![1].body);
const lastInit = () => fetchMock.mock.calls[0]![1];

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  delete process.env.OTEL_SERVICE_NAME;
});

afterEach(() => {
  setLensTraceSink(null);
  vi.unstubAllGlobals();
});

describe("createLensOtel", () => {
  it("enables tracing and POSTs OTLP JSON to the default endpoint", async () => {
    createLensOtel();
    await emitTrace();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("http://localhost:4318/v1/traces");
    expect(lastInit().method).toBe("POST");
    expect(lastInit().headers["content-type"]).toBe("application/json");

    const spans = lastBody().resourceSpans[0].scopeSpans[0].spans;
    expect(spans).toHaveLength(2);
    expect(spans[0].name).toBe("GET /users");
    expect(spans[1].parentSpanId).toBe(spans[0].spanId);
  });

  it("appends /v1/traces only when missing", async () => {
    createLensOtel({ endpoint: "https://collector.dev/v1/traces" });
    await emitTrace();
    expect(fetchMock.mock.calls[0]![0]).toBe("https://collector.dev/v1/traces");
  });

  it("reads the endpoint and service name from the environment", async () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://collector:4318/";
    process.env.OTEL_SERVICE_NAME = "billing";
    createLensOtel();
    await emitTrace();

    expect(fetchMock.mock.calls[0]![0]).toBe("http://collector:4318/v1/traces");
    expect(lastBody().resourceSpans[0].resource.attributes).toEqual([
      { key: "service.name", value: { stringValue: "billing" } },
    ]);
  });

  it("sends custom headers", async () => {
    createLensOtel({ headers: { "x-api-key": "fake-key" } });
    await emitTrace();
    expect(lastInit().headers["x-api-key"]).toBe("fake-key");
  });

  it("never throws into the host app when the collector is unreachable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    createLensOtel();
    await expect(emitTrace()).resolves.toBeUndefined();
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    error.mockRestore();
  });

  it("stops exporting after shutdown", async () => {
    const otel = createLensOtel();
    otel.shutdown();
    await emitTrace();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
