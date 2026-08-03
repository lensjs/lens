import { describe, it, expect } from "vitest";
import { WatcherTypeEnum, type LensTrace } from "@lensjs/core";
import { buildResourceSpans } from "../src/spans";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
const CREATED_AT_NS = "1767225600000000000";

const baseTrace = (overrides: Partial<LensTrace> = {}): LensTrace => ({
  traceId: "a".repeat(32),
  rootSpanId: "b".repeat(16),
  sampled: true,
  children: [],
  ...overrides,
});

const attrOf = (span: any, key: string) =>
  span.attributes.find((a: any) => a.key === key)?.value;

const spansOf = (payload: any) => payload.resourceSpans[0].scopeSpans[0].spans;

describe("buildResourceSpans", () => {
  it("builds a SERVER root span from the request entry", () => {
    const payload = buildResourceSpans(
      baseTrace({
        request: {
          type: WatcherTypeEnum.REQUEST,
          data: {
            method: "GET",
            path: "/users",
            status: 200,
            duration: "12ms",
            createdAt: CREATED_AT,
          },
        },
      }),
      "api",
    );

    const [root] = spansOf(payload);
    expect(root.name).toBe("GET /users");
    expect(root.kind).toBe(2);
    expect(root.traceId).toBe("a".repeat(32));
    expect(root.spanId).toBe("b".repeat(16));
    expect(root.parentSpanId).toBeUndefined();
    expect(root.startTimeUnixNano).toBe(CREATED_AT_NS);
    expect(root.endTimeUnixNano).toBe(
      (BigInt(CREATED_AT_NS) + 12_000_000n).toString(),
    );
    expect(attrOf(root, "http.response.status_code")).toEqual({ intValue: 200 });
    expect(attrOf(root, "url.path")).toEqual({ stringValue: "/users" });
    expect(root.status.code).toBe(0);
  });

  it("sets the service.name resource attribute", () => {
    const payload = buildResourceSpans(baseTrace(), "checkout");
    expect(payload.resourceSpans[0].resource.attributes).toEqual([
      { key: "service.name", value: { stringValue: "checkout" } },
    ]);
  });

  it("marks 5xx responses as errored and keeps the inbound parent span", () => {
    const payload = buildResourceSpans(
      baseTrace({
        parentSpanId: "c".repeat(16),
        request: {
          type: WatcherTypeEnum.REQUEST,
          data: { method: "POST", path: "/pay", status: 500 },
        },
      }),
      "api",
    );

    const [root] = spansOf(payload);
    expect(root.parentSpanId).toBe("c".repeat(16));
    expect(root.status.code).toBe(2);
  });

  it("maps queries to CLIENT db spans parented to the root span", () => {
    const payload = buildResourceSpans(
      baseTrace({
        children: [
          {
            type: WatcherTypeEnum.QUERY,
            data: {
              query: "select * from users",
              type: "postgresql",
              duration: "3ms",
              createdAt: CREATED_AT,
            },
          },
        ],
      }),
      "api",
    );

    const [span] = spansOf(payload);
    expect(span.name).toBe("db.query");
    expect(span.kind).toBe(3);
    expect(span.parentSpanId).toBe("b".repeat(16));
    expect(span.spanId).toMatch(/^[0-9a-f]{16}$/);
    expect(attrOf(span, "db.query.text")).toEqual({
      stringValue: "select * from users",
    });
    expect(attrOf(span, "db.system")).toEqual({ stringValue: "postgresql" });
  });

  it("maps outbound http calls and flags 4xx/5xx as errors", () => {
    const payload = buildResourceSpans(
      baseTrace({
        children: [
          {
            type: WatcherTypeEnum.HTTP,
            data: {
              method: "POST",
              url: "https://api.example.com/charge",
              status: 502,
            },
          },
        ],
      }),
      "api",
    );

    const [span] = spansOf(payload);
    expect(span.name).toBe("HTTP POST");
    expect(span.kind).toBe(3);
    expect(span.status.code).toBe(2);
    expect(attrOf(span, "url.full")).toEqual({
      stringValue: "https://api.example.com/charge",
    });
  });

  it("maps exceptions to errored internal spans", () => {
    const payload = buildResourceSpans(
      baseTrace({
        children: [
          {
            type: WatcherTypeEnum.EXCEPTION,
            data: { name: "TypeError", message: "boom" },
          },
        ],
      }),
      "api",
    );

    const [span] = spansOf(payload);
    expect(span.name).toBe("exception TypeError");
    expect(span.kind).toBe(1);
    expect(span.status.code).toBe(2);
    expect(attrOf(span, "exception.message")).toEqual({ stringValue: "boom" });
  });

  it("truncates oversized attribute values", () => {
    const payload = buildResourceSpans(
      baseTrace({
        children: [
          { type: WatcherTypeEnum.QUERY, data: { query: "x".repeat(900) } },
        ],
      }),
      "api",
    );

    const value = attrOf(spansOf(payload)[0], "db.query.text").stringValue;
    expect(value).toHaveLength(513);
    expect(value.endsWith("…")).toBe(true);
  });

  it("omits empty attributes and emits no spans for an empty trace", () => {
    const payload = buildResourceSpans(
      baseTrace({
        children: [{ type: WatcherTypeEnum.REDIS, data: {} }],
      }),
      "api",
    );

    const [span] = spansOf(payload);
    expect(attrOf(span, "db.operation")).toBeUndefined();
    expect(attrOf(span, "db.system")).toEqual({ stringValue: "redis" });

    expect(spansOf(buildResourceSpans(baseTrace(), "api"))).toEqual([]);
  });
});
