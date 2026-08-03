import { getCurrentRequestId } from "@lensjs/core";
import { watcherEmitter } from "../utils/emitter";
import { QueryWatcherHandler } from "../types";
import { nowISO } from "@lensjs/date";

type MongooseDebugFn = (
  collectionName: string,
  methodName: string,
  ...args: unknown[]
) => void;

type MongooseLike = {
  set: (key: "debug", value: MongooseDebugFn) => void;
};

function renderMongoOperation(
  collection: string,
  method: string,
  args: unknown[],
): string {
  let rendered = "";
  try {
    rendered = args.length
      ? args
          .map((arg) => {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          })
          .join(", ")
      : "";
  } catch {
    rendered = "";
  }

  return `${collection}.${method}(${rendered})`;
}

/**
 * Attach Lens to Mongoose so MongoDB operations correlate to the request that
 * issued them. Mongoose's `debug` hook fires IN-CONTEXT at query-issue time, so
 * the request id is captured directly. Use this with `createMongooseHandler()`.
 *
 * ```ts
 * import mongoose from "mongoose";
 * attachMongooseLens(mongoose);
 * // handler: createMongooseHandler()
 * ```
 */
export function attachMongooseLens(mongoose: MongooseLike): void {
  mongoose.set("debug", (collectionName, methodName, ...args) => {
    watcherEmitter.emit("mongooseQuery", {
      query: renderMongoOperation(collectionName, methodName, args),
      requestId: getCurrentRequestId(),
    });
  });
}

export function createMongooseHandler(): QueryWatcherHandler {
  return async ({ onQuery }) => {
    watcherEmitter.on("mongooseQuery", (payload) => {
      onQuery(
        {
          query: payload.query,
          // Mongoose's debug hook carries no timing information.
          duration: "0 ms",
          createdAt: nowISO(),
          type: "mongodb",
        },
        payload.requestId ?? getCurrentRequestId(),
      );
    });
  };
}
