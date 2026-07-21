import { describe, it, expect } from "vitest";
import { lensContext } from "@lensjs/core";
import { withLensPrisma } from "../src/query/prisma";
import { watcherEmitter } from "../src/utils/emitter";

/**
 * These tests use the REAL async context (no `@lensjs/core` mock) to prove that
 * `withLensPrisma` attaches each query to the request that issued it — even when
 * many requests run concurrently and each query yields to the event loop before
 * the (detached-style) event is emitted.
 */

// Minimal fake client mimicking Prisma's `$extends({ query: { $allOperations } })`.
// The extension wraps the operation exactly where the user awaits it (in-context).
function makeFakeClient() {
  return {
    $extends(extension: any) {
      const makeOp =
        (model: string, operation: string) =>
        (args: any) =>
          extension.query.$allOperations({
            model,
            operation,
            args,
            query: async (a: any) => {
              // Simulate async engine work so contexts interleave.
              await new Promise((resolve) => setTimeout(resolve, 5));
              return { model, operation, args: a };
            },
          });

      return {
        user: { findMany: makeOp("User", "findMany") },
      };
    },
  };
}

describe("withLensPrisma correlation (real async context)", () => {
  it("attaches each concurrent query to the request that issued it", async () => {
    const prisma = withLensPrisma(makeFakeClient() as any, {
      provider: "postgresql",
    });

    const events: Array<{ query: string; requestId?: string }> = [];
    const listener = (event: any) => events.push(event);
    watcherEmitter.on("prismaQuery", listener);

    const runRequest = (requestId: string) =>
      new Promise<void>((resolve, reject) => {
        lensContext.run({ requestId }, () => {
          prisma.user
            .findMany({ where: { id: requestId } })
            .then(() => resolve())
            .catch(reject);
        });
      });

    await Promise.all([
      runRequest("req-A"),
      runRequest("req-B"),
      runRequest("req-C"),
    ]);

    watcherEmitter.off("prismaQuery", listener);

    expect(events).toHaveLength(3);

    const byRequest = Object.fromEntries(
      events.map((e) => [e.requestId, e.query]),
    );
    expect(byRequest["req-A"]).toBe('User.findMany({"where":{"id":"req-A"}})');
    expect(byRequest["req-B"]).toBe('User.findMany({"where":{"id":"req-B"}})');
    expect(byRequest["req-C"]).toBe('User.findMany({"where":{"id":"req-C"}})');
  });

  it("reports an empty request id for queries issued outside any request", async () => {
    const prisma = withLensPrisma(makeFakeClient() as any, {
      provider: "postgresql",
    });

    const events: Array<{ requestId?: string }> = [];
    const listener = (event: any) => events.push(event);
    watcherEmitter.on("prismaQuery", listener);

    await prisma.user.findMany({ where: { id: 1 } });

    watcherEmitter.off("prismaQuery", listener);

    expect(events).toHaveLength(1);
    expect(events[0]!.requestId).toBeUndefined();
  });
});
