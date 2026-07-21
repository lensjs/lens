import { describe, it, expect, vi } from "vitest";
import { watcherEmitter } from "../src/utils/emitter";
import { createSequelizeHandler } from "../src/query/sequelize";
import { createKyselyHandler, createLensKyselyPlugin } from "../src/query/kysely";
import { createMikroOrmHandler } from "../src/query/mikro-orm";
import { createPrismaHandler } from "../src/query/prisma";
import { lensContext } from "@lensjs/core";

/**
 * End-to-end "displayed right" tests: these use the REAL `@lensjs/core`
 * formatters (interpolateQuery + formatSqlQuery), so they verify the exact query
 * text that shows up in the dashboard for every driver and parameter style —
 * values interpolated, no leftover placeholders, correct duration/type/requestId.
 */

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Register a handler, emit one event, and return the single produced entry. */
async function capture(
  register: (onQuery: ReturnType<typeof vi.fn>) => Promise<void>,
  emit: () => void,
) {
  const onQuery = vi.fn();
  await register(onQuery);
  emit();
  expect(onQuery).toHaveBeenCalledTimes(1);
  const [entry, requestId] = onQuery.mock.calls[0]!;
  return { entry, requestId };
}

describe("Sequelize — displayed query", () => {
  it("interpolates $1 positional array binds (INSERT)", async () => {
    const { entry, requestId } = await capture(
      (onQuery) => createSequelizeHandler({ provider: "mysql" })({ onQuery }),
      () =>
        watcherEmitter.emit("sequelizeQuery", {
          sql: "INSERT INTO `users` (`id`,`name`) VALUES (NULL,$1)",
          bind: ["John Doe"],
          timing: 3.2,
          requestId: "R-seq-insert",
        }),
    );

    expect(collapse(entry.query)).toContain("'John Doe'");
    expect(entry.query).not.toContain("$1");
    expect(entry.query.toUpperCase()).toContain("INSERT INTO");
    expect(entry.duration).toBe("3.2 ms");
    expect(entry.type).toBe("mysql");
    expect(requestId).toBe("R-seq-insert");
  });

  it("interpolates $1 object binds", async () => {
    const { entry } = await capture(
      (onQuery) => createSequelizeHandler({ provider: "postgresql" })({ onQuery }),
      () =>
        watcherEmitter.emit("sequelizeQuery", {
          sql: "INSERT INTO `users` (`name`) VALUES ($1)",
          bind: { $1: "Ada" },
          timing: 1,
          requestId: "R-seq-obj",
        }),
    );

    expect(entry.query).toContain("'Ada'");
    expect(entry.query).not.toContain("$1");
  });

  it("keeps already-inlined SELECT values (no bind)", async () => {
    const { entry } = await capture(
      (onQuery) => createSequelizeHandler({ provider: "mysql" })({ onQuery }),
      () =>
        watcherEmitter.emit("sequelizeQuery", {
          sql: "SELECT `id`, `name` FROM `users` WHERE `name` = 'John Doe'",
          bind: [],
          timing: 0.9,
          requestId: "R-seq-select",
        }),
    );

    expect(entry.query).toContain("'John Doe'");
    expect(entry.query.toUpperCase()).toContain("SELECT");
  });
});

describe("Kysely — displayed query", () => {
  it("interpolates ? array parameters and correlates via queryId", async () => {
    const plugin = createLensKyselyPlugin();
    const queryId = { queryId: "kd-1" };

    // Plugin captures the request id in-context at compile time.
    lensContext.run({ requestId: "R-ky" }, () => {
      plugin.transformQuery({ queryId, node: {} } as any);
    });

    const { entry, requestId } = await capture(
      (onQuery) => createKyselyHandler({ provider: "mysql" })({ onQuery }),
      () =>
        watcherEmitter.emit("kyselyQuery", {
          level: "query",
          queryDurationMillis: 5.5,
          query: {
            sql: "select * from `users` where `id` = ?",
            parameters: [42],
            queryId,
          },
        } as any),
    );

    expect(entry.query).toContain("42");
    expect(entry.query).not.toContain("?");
    expect(entry.query.toUpperCase()).toContain("SELECT");
    expect(entry.duration).toBe("5.5 ms");
    expect(entry.type).toBe("mysql");
    expect(requestId).toBe("R-ky");
  });
});

describe("MikroORM — displayed query", () => {
  it("interpolates ? array bindings (mysql/sqlite style)", async () => {
    const { entry, requestId } = await capture(
      (onQuery) => createMikroOrmHandler({ provider: "mysql" })({ onQuery }),
      () =>
        watcherEmitter.emit("mikroOrmQuery", {
          query: "SELECT * FROM `users` WHERE `id` = ?",
          params: [42],
          took: 2.5,
          requestId: "R-mk-q",
        }),
    );

    expect(entry.query).toContain("42");
    expect(entry.query).not.toContain("?");
    expect(entry.duration).toBe("2.5 ms");
    expect(entry.type).toBe("mysql");
    expect(requestId).toBe("R-mk-q");
  });

  it("interpolates $1 array bindings (postgres style)", async () => {
    const { entry } = await capture(
      (onQuery) => createMikroOrmHandler({ provider: "postgresql" })({ onQuery }),
      () =>
        watcherEmitter.emit("mikroOrmQuery", {
          query: 'INSERT INTO "users" ("name") VALUES ($1)',
          params: ["Ada"],
          took: 1,
          requestId: "R-mk-pg",
        }),
    );

    expect(entry.query).toContain("'Ada'");
    expect(entry.query).not.toContain("$1");
  });
});

describe("Prisma — displayed query", () => {
  it("shows the operation label as-is (withLensPrisma bridge)", async () => {
    const { entry, requestId } = await capture(
      (onQuery) => createPrismaHandler({ provider: "postgresql" })({ onQuery }),
      () =>
        watcherEmitter.emit("prismaQuery", {
          query: 'user.findMany({"where":{"id":1}})',
          duration: 3.14159,
          provider: "postgresql",
          requestId: "R-prisma",
        }),
    );

    expect(entry.query).toBe('user.findMany({"where":{"id":1}})');
    expect(entry.duration).toBe("3.1 ms");
    expect(entry.type).toBe("postgresql");
    expect(requestId).toBe("R-prisma");
  });

  it("legacy $on path interpolates $1 params + formats SQL", async () => {
    const onQuery = vi.fn();
    const prisma = { $on: vi.fn() };
    await createPrismaHandler({ prisma, provider: "postgresql" })({ onQuery });

    const listener = prisma.$on.mock.calls.find((c) => c[0] === "query")![1];
    await listener({
      query: 'SELECT * FROM "User" WHERE "id" = $1',
      params: "[1]",
      duration: 10,
      timestamp: "2025-09-05T12:00:00.000Z",
    });

    expect(onQuery).toHaveBeenCalledTimes(1);
    const [entry] = onQuery.mock.calls[0]!;
    expect(entry.query).toContain("1");
    expect(entry.query).not.toContain("$1");
    expect(entry.query.toUpperCase()).toContain("SELECT");
    expect(entry.duration).toBe("10 ms");
    expect(entry.type).toBe("postgresql");
  });

  it("legacy $on path leaves MongoDB queries untouched", async () => {
    const onQuery = vi.fn();
    const prisma = { $on: vi.fn() };
    await createPrismaHandler({ prisma, provider: "mongodb" })({ onQuery });

    const listener = prisma.$on.mock.calls.find((c) => c[0] === "query")![1];
    await listener({
      query: 'db.users.find({ _id: 1 })',
      params: "{}",
      duration: 5,
      timestamp: "2025-09-05T12:05:00.000Z",
    });

    const [entry] = onQuery.mock.calls[0]!;
    expect(entry.query).toBe("db.users.find({ _id: 1 })");
    expect(entry.type).toBe("mongodb");
  });
});
