import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { lensEmitter, getCurrentRequestId } from "@lensjs/core";
import { nowISO } from "@lensjs/date";
import {
  emitLensLog,
  patchConsole,
  createLensPinoStream,
  createLensWinstonTransport,
} from "../src/log";

vi.mock("@lensjs/core", () => ({
  lensEmitter: { emit: vi.fn() },
  getCurrentRequestId: vi.fn(),
}));

vi.mock("@lensjs/date", () => ({
  nowISO: vi.fn(),
}));

const REQUEST_ID = "req-1";
const NOW = "2025-09-05T10:00:00Z";

const emitMock = lensEmitter.emit as Mock;

function lastLog(source: string): Record<string, any> | undefined {
  return emitMock.mock.calls
    .filter((c) => c[0] === "log" && c[1]?.source === source)
    .map((c) => c[1])
    .pop();
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

beforeEach(() => {
  vi.clearAllMocks();
  (nowISO as Mock).mockReturnValue(NOW);
  (getCurrentRequestId as Mock).mockReturnValue(REQUEST_ID);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("emitLensLog", () => {
  it("emits a correlated, redacted log entry", () => {
    emitLensLog({
      level: "error",
      message: "boom",
      context: { password: "hunter2", ok: 1 },
      source: "custom",
    });

    expect(lensEmitter.emit).toHaveBeenCalledWith("log", {
      level: "error",
      message: "boom",
      context: { password: "*******", ok: 1 },
      source: "custom",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
  });

  it("honors explicit requestId/createdAt and extra redact keys", () => {
    emitLensLog(
      {
        level: "info",
        message: "hi",
        context: { apiSecret: "x", keep: "y" },
        requestId: "r2",
        createdAt: "t2",
      },
      { redactKeys: ["apiSecret"] },
    );

    expect(lensEmitter.emit).toHaveBeenCalledWith("log", {
      level: "info",
      message: "hi",
      context: { apiSecret: "*******", keep: "y" },
      source: undefined,
      requestId: "r2",
      createdAt: "t2",
    });
  });

  it("redacts nested secrets", () => {
    emitLensLog({
      level: "info",
      message: "nested",
      context: { user: { name: "a", token: "t" } },
    });

    expect(emitMock).toHaveBeenCalledWith(
      "log",
      expect.objectContaining({
        context: { user: { name: "a", token: "*******" } },
      }),
    );
  });

  it("masks sensitive key/value pairs in the message itself", () => {
    emitLensLog({ level: "info", message: "token: sk_live_abc123 done" });
    expect(lastLog("custom") ?? emitMock.mock.calls.at(-1)?.[1]).toMatchObject({
      message: "token: ******* done",
    });
  });

  it("masks secrets in object-formatted and extra-key messages", () => {
    emitLensLog(
      { level: "info", message: "{ apiKey: 'sk_live_x', keep: 1 }" },
      { redactKeys: ["ssn"] },
    );
    expect(emitMock.mock.calls.at(-1)?.[1].message).toBe(
      "{ apiKey: *******, keep: 1 }",
    );

    emitLensLog(
      { level: "info", message: "ssn=123-45-6789" },
      { redactKeys: ["ssn"] },
    );
    expect(emitMock.mock.calls.at(-1)?.[1].message).toBe("ssn=*******");
  });

  it("leaves a benign message untouched", () => {
    emitLensLog({ level: "info", message: "user 7 logged in" });
    expect(emitMock.mock.calls.at(-1)?.[1].message).toBe("user 7 logged in");
  });
});

describe("patchConsole", () => {
  it("captures console output, formats args, and restores originals", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const restore = patchConsole({ methods: ["error"] });
    console.error("failed %s", "hard");

    expect(lastLog("console")).toMatchObject({
      level: "error",
      message: "failed hard",
      source: "console",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
    // The original method still runs.
    expect(errSpy).toHaveBeenCalled();

    restore();
    emitMock.mockClear();
    console.error("after restore");
    expect(lastLog("console")).toBeUndefined();
  });

  it("redacts secrets logged as objects through the message path", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const restore = patchConsole({ methods: ["log"] });
    console.log({ apiKey: "sk_live_secret", userId: 7 });
    restore();

    expect(lastLog("console")?.message).toContain("apiKey: *******");
    expect(lastLog("console")?.message).not.toContain("sk_live_secret");
  });
});

describe("createLensPinoStream", () => {
  it("parses a pino line into a correlated, redacted log", async () => {
    const stream = createLensPinoStream();
    const line =
      JSON.stringify({
        level: 50,
        time: 123,
        pid: 1,
        hostname: "h",
        msg: "db down",
        userId: 7,
        password: "p",
      }) + "\n";

    await new Promise<void>((resolve) => stream.write(line, () => resolve()));

    expect(lensEmitter.emit).toHaveBeenCalledWith("log", {
      level: "error",
      message: "db down",
      context: { userId: 7, password: "*******" },
      source: "pino",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
  });

  it("works as a real pino destination", async () => {
    const pino = (await import("pino")).default;
    const logger = pino({ base: null }, createLensPinoStream());

    logger.warn({ a: 1 }, "heads up");
    await flush();

    expect(lastLog("pino")).toMatchObject({
      level: "warn",
      message: "heads up",
      source: "pino",
      requestId: REQUEST_ID,
    });
  });
});

describe("createLensWinstonTransport", () => {
  it("forwards winston logs as correlated, redacted logs", async () => {
    const winston = (await import("winston")).default;
    const logger = winston.createLogger({
      level: "silly",
      transports: [createLensWinstonTransport()],
    });

    logger.info("user created", { userId: 9, token: "secret" });
    await flush();

    const entry = lastLog("winston");
    expect(entry).toMatchObject({
      level: "info",
      message: "user created",
      source: "winston",
      requestId: REQUEST_ID,
      createdAt: NOW,
    });
    expect(entry?.context).toMatchObject({ userId: 9, token: "*******" });
  });
});
