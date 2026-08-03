import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { createLensNotifier } from "../../src/core/notifier";

const entry = (over: Record<string, any> = {}) => ({
  name: "TypeError",
  message: "boom",
  fingerprint: "fp1",
  createdAt: "2025-01-01T00:00:00.000Z",
  id: "exc-1",
  ...over,
});

describe("createLensNotifier", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts a Slack payload for slack webhook URLs", () => {
    const n = createLensNotifier({
      webhookUrl: "https://hooks.slack.com/services/x",
    });
    n.notifyException(entry());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain("hooks.slack.com");
    expect(JSON.parse(opts.body).text).toContain("TypeError: boom");
  });

  it("posts a Discord payload for discord webhook URLs", () => {
    const n = createLensNotifier({
      webhookUrl: "https://discord.com/api/webhooks/1/abc",
    });
    n.notifyException(entry());

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).content).toContain(
      "TypeError: boom",
    );
  });

  it("posts a minimal, redaction-safe summary for a generic webhook", () => {
    const n = createLensNotifier({
      webhookUrl: "https://example.com/hook",
      provider: "webhook",
      dashboardUrl: "https://app.example.com/lens",
    });
    n.notifyException(
      entry({
        trace: ["at secret(/app/x.ts:1:1)"],
        codeFrame: { context: { error: "const token = 'sk_live_x';" } },
        cause: "sensitive",
      }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({
      type: "exception",
      exception: {
        id: "exc-1",
        name: "TypeError",
        message: "boom",
        fingerprint: "fp1",
      },
      link: "https://app.example.com/lens/exceptions/exc-1",
    });
    // The full entry (stack, code frame, cause) must never leave the host.
    expect(body).not.toHaveProperty("entry");
    expect(fetchMock.mock.calls[0][1].body).not.toContain("sk_live_x");
    expect(fetchMock.mock.calls[0][1].body).not.toContain("secret");
  });

  it("dedupes repeat occurrences of a fingerprint within the cooldown", () => {
    const n = createLensNotifier({
      webhookUrl: "https://example.com/hook",
      cooldownMs: 60_000,
    });
    n.notifyException(entry());
    n.notifyException(entry());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    n.notifyException(entry({ fingerprint: "fp2" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("alerts on every occurrence when everyOccurrence is set", () => {
    const n = createLensNotifier({
      webhookUrl: "https://example.com/hook",
      everyOccurrence: true,
    });
    n.notifyException(entry());
    n.notifyException(entry());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never throws when the delivery fetch rejects", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockReturnValue(Promise.reject(new Error("network")));
    const n = createLensNotifier({ webhookUrl: "https://example.com/hook" });
    expect(() => n.notifyException(entry())).not.toThrow();
  });
});
