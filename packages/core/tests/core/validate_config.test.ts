import { describe, it, expect } from "vitest";
import { assertValidConfig } from "../../src/core/validate_config";

describe("assertValidConfig", () => {
  it("accepts an empty / undefined config", () => {
    expect(() => assertValidConfig(undefined)).not.toThrow();
    expect(() => assertValidConfig({})).not.toThrow();
  });

  it("accepts a fully valid config", () => {
    expect(() =>
      assertValidConfig({
        path: "/lens",
        appName: "My App",
        enabled: true,
        hiddenParams: { headers: ["Authorization"], bodyParams: ["password"] },
        storeQueueConfig: {
          batchSize: 100,
          processIntervalMs: 2000,
          retention: {
            defaultMaxAgeMs: 86_400_000,
            perType: { request: 3_600_000 },
            sweepIntervalMs: 300_000,
          },
        },
        sampling: { rate: 0.5, alwaysOnErrors: true, alwaysOnSlowMs: 1000 },
        alerts: { webhookUrl: "https://hooks.slack.com/x", provider: "slack" },
      } as any),
    ).not.toThrow();
  });

  it("rejects an empty path", () => {
    expect(() => assertValidConfig({ path: "" } as any)).toThrow(/`path`/);
  });

  it("rejects a sampling rate outside 0..1", () => {
    expect(() =>
      assertValidConfig({ sampling: { rate: 1.5 } } as any),
    ).toThrow(/sampling\.rate/);
    expect(() =>
      assertValidConfig({ sampling: { rate: -0.1 } } as any),
    ).toThrow(/sampling\.rate/);
  });

  it("rejects non-array hiddenParams", () => {
    expect(() =>
      assertValidConfig({ hiddenParams: { headers: "Authorization" } } as any),
    ).toThrow(/hiddenParams\.headers/);
  });

  it("rejects an invalid alerts webhook URL", () => {
    expect(() =>
      assertValidConfig({ alerts: { webhookUrl: "not-a-url" } } as any),
    ).toThrow(/alerts\.webhookUrl/);
  });

  it("rejects a negative retention age", () => {
    expect(() =>
      assertValidConfig({
        storeQueueConfig: { retention: { perType: { query: -5 } } },
      } as any),
    ).toThrow(/retention\.perType\.query/);
  });

  it("aggregates multiple errors into one message", () => {
    try {
      assertValidConfig({
        path: "",
        sampling: { rate: 2 },
        alerts: { webhookUrl: "nope" },
      } as any);
      throw new Error("should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("`path`");
      expect(message).toContain("sampling.rate");
      expect(message).toContain("alerts.webhookUrl");
    }
  });
});
