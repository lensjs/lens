import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseTraceparent,
  buildTraceparent,
  createTraceContext,
  recordTraceEntry,
  getActiveTraceparent,
  flushTrace,
  setLensTraceSink,
  type LensTrace,
} from "../../src/utils/tracing";
import { finalizeCapture } from "../../src/utils/sampling";
import { lensContext } from "../../src/utils/async_context";
import { WatcherTypeEnum } from "../../src/types";

afterEach(() => setLensTraceSink(null));

const TP = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";

describe("parseTraceparent / buildTraceparent", () => {
  it("parses a valid traceparent", () => {
    expect(parseTraceparent(TP)).toEqual({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      parentSpanId: "b7ad6b7169203331",
      sampled: true,
    });
  });

  it("rejects malformed or all-zero ids", () => {
    expect(parseTraceparent(undefined)).toBeNull();
    expect(parseTraceparent("nope")).toBeNull();
    expect(
      parseTraceparent(`00-${"0".repeat(32)}-${"1".repeat(16)}-01`),
    ).toBeNull();
  });

  it("reads the sampled flag", () => {
    expect(
      parseTraceparent(`00-${"a".repeat(32)}-${"b".repeat(16)}-00`)?.sampled,
    ).toBe(false);
  });

  it("builds a traceparent", () => {
    expect(buildTraceparent("a".repeat(32), "b".repeat(16))).toBe(
      `00-${"a".repeat(32)}-${"b".repeat(16)}-01`,
    );
    expect(buildTraceparent("a".repeat(32), "b".repeat(16), false)).toBe(
      `00-${"a".repeat(32)}-${"b".repeat(16)}-00`,
    );
  });
});

describe("createTraceContext", () => {
  it("returns undefined when tracing is disabled", () => {
    expect(createTraceContext()).toBeUndefined();
  });

  it("starts a new trace when enabled and no traceparent", () => {
    setLensTraceSink(() => {});
    const ctx = createTraceContext();
    expect(ctx).toBeDefined();
    expect(ctx!.traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(ctx!.rootSpanId).toMatch(/^[0-9a-f]{16}$/);
    expect(ctx!.parentSpanId).toBeUndefined();
  });

  it("joins an incoming traceparent", () => {
    setLensTraceSink(() => {});
    const ctx = createTraceContext(TP);
    expect(ctx!.traceId).toBe("0af7651916cd43dd8448eb211c80319c");
    expect(ctx!.parentSpanId).toBe("b7ad6b7169203331");
  });
});

describe("recordTraceEntry / getActiveTraceparent / flushTrace", () => {
  beforeEach(() => setLensTraceSink(() => {}));

  it("collects entries; getActiveTraceparent reflects the context", async () => {
    const ctx = createTraceContext()!;
    await lensContext.run({ requestId: "r", trace: ctx }, async () => {
      recordTraceEntry({ type: WatcherTypeEnum.QUERY, data: { q: 1 } });
      expect(getActiveTraceparent()).toBe(
        buildTraceparent(ctx.traceId, ctx.rootSpanId, true),
      );
    });
    expect(ctx.entries).toHaveLength(1);
  });

  it("splits the request entry from children and calls the sink", async () => {
    const sink = vi.fn();
    setLensTraceSink(sink);
    const ctx = createTraceContext(TP)!;
    await lensContext.run({ requestId: "r", trace: ctx }, async () => {
      recordTraceEntry({ type: WatcherTypeEnum.QUERY, data: { q: 1 } });
      recordTraceEntry({ type: WatcherTypeEnum.REQUEST, data: { r: 1 } });
      recordTraceEntry({ type: WatcherTypeEnum.CACHE, data: { c: 1 } });
      await flushTrace();
    });

    expect(sink).toHaveBeenCalledTimes(1);
    const trace = sink.mock.calls[0]![0] as LensTrace;
    expect(trace.traceId).toBe("0af7651916cd43dd8448eb211c80319c");
    expect(trace.parentSpanId).toBe("b7ad6b7169203331");
    expect(trace.request?.type).toBe(WatcherTypeEnum.REQUEST);
    expect(trace.children).toHaveLength(2);
  });

  it("flushTrace is a no-op without an active trace", async () => {
    const sink = vi.fn();
    setLensTraceSink(sink);
    await flushTrace();
    expect(sink).not.toHaveBeenCalled();
  });

  it("finalizeCapture flushes the trace when the request is kept", async () => {
    const sink = vi.fn();
    setLensTraceSink(sink);
    const ctx = createTraceContext()!;
    await lensContext.run({ requestId: "r", trace: ctx }, async () => {
      recordTraceEntry({ type: WatcherTypeEnum.REQUEST, data: {} });
      await finalizeCapture(200, 5); // no sampling active -> kept
    });
    expect(sink).toHaveBeenCalledTimes(1);
  });
});
