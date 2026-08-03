import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetentionStore } from "../../src/mixins/retention_store";
import { WatcherTypeEnum } from "../../src/types";

vi.mock("@lensjs/date", () => ({
  now: () => ({ toMillis: () => 1_000_000 }),
  convertToUTC: (ms: number) => `iso(${ms})`,
}));

class FakeBase {
  public storeConfig: any;

  constructor(config?: any) {
    this.storeConfig = config;
  }

  async initialize(): Promise<void> {}

  async pruneOlderThan(
    _cutoffISO: string,
    _type?: WatcherTypeEnum,
  ): Promise<number> {
    return 0;
  }
}

const Composed = RetentionStore(FakeBase);

describe("RetentionStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("prunes every type using defaultMaxAgeMs, honoring perType overrides", async () => {
    const spy = vi.spyOn(FakeBase.prototype, "pruneOlderThan");
    const store = new Composed({
      retention: { defaultMaxAgeMs: 5000, perType: { request: 1000 } },
    }) as any;

    await store.runRetentionSweep();

    const types = Object.values(WatcherTypeEnum);
    expect(spy).toHaveBeenCalledTimes(types.length);
    // request uses its perType override (1_000_000 - 1000)
    expect(spy).toHaveBeenCalledWith("iso(999000)", WatcherTypeEnum.REQUEST);
    // others fall back to the default (1_000_000 - 5000)
    expect(spy).toHaveBeenCalledWith("iso(995000)", WatcherTypeEnum.QUERY);
  });

  it("only prunes listed types when no default is set", async () => {
    const spy = vi.spyOn(FakeBase.prototype, "pruneOlderThan");
    const store = new Composed({
      retention: { perType: { request: 2000 } },
    }) as any;

    await store.runRetentionSweep();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("iso(998000)", WatcherTypeEnum.REQUEST);
  });

  it("does nothing without a retention config", async () => {
    const spy = vi.spyOn(FakeBase.prototype, "pruneOlderThan");
    const store = new Composed({}) as any;

    await store.runRetentionSweep();
    store.startRetentionSweep();

    expect(spy).not.toHaveBeenCalled();
    expect(store.retentionInterval).toBeNull();
  });

  it("starts and stops the sweep interval when a policy is set", () => {
    const store = new Composed({
      retention: { defaultMaxAgeMs: 1000, sweepIntervalMs: 10_000 },
    }) as any;

    store.startRetentionSweep();
    expect(store.retentionInterval).not.toBeNull();

    store.stopRetentionSweep();
    expect(store.retentionInterval).toBeNull();
  });
});
