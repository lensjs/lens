import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSamplingState,
  finalizeSampling,
  persistEntry,
} from "../../src/utils/sampling";
import { lensContext } from "../../src/utils/async_context";
import { getStore } from "../../src/context/context";
import { WatcherTypeEnum } from "../../src/types";

vi.mock("../../src/context/context", () => ({
  getStore: vi.fn(),
}));

const mkEntry = (id: string) => ({
  id,
  type: WatcherTypeEnum.QUERY,
  data: { q: id },
});

describe("createSamplingState", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns undefined when sampling is unset or rate >= 1", () => {
    expect(createSamplingState(undefined)).toBeUndefined();
    expect(createSamplingState({ rate: 1 })).toBeUndefined();
  });

  it("always buffers when rate is 0", () => {
    expect(createSamplingState({ rate: 0 })).toEqual({
      pending: true,
      keep: false,
      buffer: [],
    });
  });

  it("respects the rate roll", () => {
    const spy = vi.spyOn(Math, "random");
    spy.mockReturnValue(0.1);
    expect(createSamplingState({ rate: 0.5 })).toBeUndefined(); // sampled in
    spy.mockReturnValue(0.9);
    expect(createSamplingState({ rate: 0.5 })).toMatchObject({
      pending: true,
    }); // sampled out
  });
});

describe("persistEntry", () => {
  let save: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    save = vi.fn();
    (getStore as any).mockReturnValue({ save });
  });

  it("saves immediately when there is no sampling context", async () => {
    await persistEntry(mkEntry("a"));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
  });

  it("buffers when the request is sampled-out (pending)", async () => {
    const state = { pending: true, keep: false, buffer: [] as any[] };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await persistEntry(mkEntry("a"));
    });
    expect(save).not.toHaveBeenCalled();
    expect(state.buffer).toHaveLength(1);
  });

  it("force-saves and marks keep even when pending", async () => {
    const state = { pending: true, keep: false, buffer: [] as any[] };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await persistEntry(mkEntry("x"), { force: true });
    });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: "x" }));
    expect(state.keep).toBe(true);
    expect(state.buffer).toHaveLength(0);
  });
});

describe("finalizeSampling", () => {
  let save: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    save = vi.fn();
    (getStore as any).mockReturnValue({ save });
  });

  it("flushes the buffer for an errored request (alwaysOnErrors default)", async () => {
    const state = {
      pending: true,
      keep: false,
      buffer: [mkEntry("a"), mkEntry("b")],
    };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await finalizeSampling(500, 10, { rate: 0.1 });
    });
    expect(save).toHaveBeenCalledTimes(2);
    expect(state.pending).toBe(false);
  });

  it("discards the buffer for a normal sampled-out request", async () => {
    const state = { pending: true, keep: false, buffer: [mkEntry("a")] };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await finalizeSampling(200, 10, { rate: 0.1 });
    });
    expect(save).not.toHaveBeenCalled();
    expect(state.buffer).toHaveLength(0);
  });

  it("keeps slow requests via alwaysOnSlowMs", async () => {
    const state = { pending: true, keep: false, buffer: [mkEntry("a")] };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await finalizeSampling(200, 2000, { rate: 0.1, alwaysOnSlowMs: 1000 });
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("keeps when an exception marked the request (keep=true)", async () => {
    const state = { pending: true, keep: true, buffer: [mkEntry("a")] };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await finalizeSampling(200, 10, { rate: 0.1, alwaysOnErrors: false });
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when not pending", async () => {
    const state = { pending: false, keep: false, buffer: [mkEntry("a")] };
    await lensContext.run({ requestId: "r", sampling: state }, async () => {
      await finalizeSampling(500, 10, { rate: 0.1 });
    });
    expect(save).not.toHaveBeenCalled();
  });
});
