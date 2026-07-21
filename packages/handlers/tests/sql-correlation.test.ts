import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import { lensContext } from "@lensjs/core";
import { watcherEmitter } from "../src/utils/emitter";
import {
  attachSequelizeLens,
  createSequelizeHandler,
} from "../src/query/sequelize";
import { createLensKyselyPlugin, createKyselyHandler } from "../src/query/kysely";
import { attachMikroOrmLens, createMikroOrmHandler } from "../src/query/mikro-orm";

/**
 * These tests use the REAL async context (no `@lensjs/core` mock) to prove that
 * each ORM integration captures the request id IN-CONTEXT at query-issue time
 * and still attaches it when the driver emits its event from a detached context.
 */

function collect(event: string) {
  const events: any[] = [];
  const listener = (e: any) => events.push(e);
  watcherEmitter.on(event as any, listener);
  return { events, stop: () => watcherEmitter.off(event as any, listener) };
}

describe("Sequelize in-context correlation (attachSequelizeLens)", () => {
  it("captures the request id in beforeQuery and emits it from a detached afterQuery", () => {
    const hooks: Record<string, Function[]> = {};
    const fakeSequelize = {
      addHook: (name: string, fn: Function) => {
        (hooks[name] ??= []).push(fn);
      },
    };
    attachSequelizeLens(fakeSequelize);

    const { events, stop } = collect("sequelizeQuery");

    const options: any = {};
    // beforeQuery runs in-context (before the driver detaches).
    lensContext.run({ requestId: "R-seq" }, () => {
      hooks.beforeQuery!.forEach((fn) => fn(options));
    });
    // afterQuery runs detached (no context) but reads the stamped options.
    hooks.afterQuery!.forEach((fn) =>
      fn(options, {
        sql: "INSERT INTO `users` (`name`) VALUES ($1)",
        bind: { $1: "Ada" },
      }),
    );

    stop();
    expect(events).toHaveLength(1);
    expect(events[0].requestId).toBe("R-seq");
    expect(events[0].sql).toContain("INSERT INTO");
  });

  it("handler forwards the captured request id + interpolates bind params", async () => {
    const onQuery = vi.fn();
    await createSequelizeHandler({ provider: "mysql" })({ onQuery });

    watcherEmitter.emit("sequelizeQuery", {
      sql: "INSERT INTO `users` (`name`) VALUES ($1)",
      bind: { $1: "Ada" },
      timing: 1.2,
      requestId: "R-seq2",
    });

    expect(onQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mysql" }),
      "R-seq2",
    );
    const [entry] = onQuery.mock.calls[0]!;
    expect(entry.query).toContain("'Ada'");
  });
});

describe("Kysely in-context correlation (createLensKyselyPlugin)", () => {
  it("links the plugin capture to the detached log event via queryId", async () => {
    const plugin = createLensKyselyPlugin();
    const queryId = { queryId: "ky-1" };
    const node = {} as any;

    // transformQuery runs in-context at compile time.
    lensContext.run({ requestId: "R-ky" }, () => {
      plugin.transformQuery({ queryId, node } as any);
    });

    const onQuery = vi.fn();
    await createKyselyHandler({ provider: "sqlite" })({ onQuery });

    // The log event fires detached, but carries the same queryId.
    watcherEmitter.emit("kyselyQuery", {
      level: "query",
      queryDurationMillis: 2.5,
      query: { sql: "SELECT 1", parameters: [], queryId, query: node },
    } as any);

    expect(onQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sqlite" }),
      "R-ky",
    );
  });
});

describe("MikroORM in-context correlation (attachMikroOrmLens)", () => {
  it("captures the request id from knex's in-context query event", () => {
    const knex = new EventEmitter();
    const fakeOrm = { em: { getConnection: () => ({ getKnex: () => knex }) } };
    attachMikroOrmLens(fakeOrm);

    const { events, stop } = collect("mikroOrmQuery");

    const q = {
      __knexQueryUid: "u1",
      sql: "INSERT INTO `users` (`name`) VALUES (?)",
      bindings: ["Ada"],
    };
    // knex 'query' fires in-context; 'query-response' fires detached.
    lensContext.run({ requestId: "R-mk" }, () => {
      knex.emit("query", q);
    });
    knex.emit("query-response", { rows: [] }, q);

    stop();
    expect(events).toHaveLength(1);
    expect(events[0].requestId).toBe("R-mk");
    expect(events[0].query).toContain("INSERT");
  });
});
