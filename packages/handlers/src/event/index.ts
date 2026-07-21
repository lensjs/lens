import { getCurrentRequestId, lensEmitter } from "@lensjs/core";
import { nowISO } from "@lensjs/date";

const MAX_PAYLOAD = 10_000;
const DEFAULT_EXCEPT = ["newListener", "removeListener"];

function capPayload(payload: unknown): unknown {
  if (payload === undefined) return undefined;
  try {
    const json = JSON.stringify(payload);
    if (json && json.length > MAX_PAYLOAD) {
      return { __truncated: true, preview: json.slice(0, MAX_PAYLOAD) };
    }
    return payload;
  } catch {
    return String(payload);
  }
}

/**
 * Manually record an application/domain event for the Lens event watcher,
 * correlated to the current request.
 */
export function emitLensEvent(name: string, payload?: unknown): void {
  lensEmitter.emit("event", {
    name,
    payload: capPayload(payload),
    createdAt: nowISO(),
    requestId: getCurrentRequestId(),
  });
}

export interface InstrumentEmitterOptions {
  /** Only capture these event names. */
  only?: string[];
  /** Never capture these event names (merged with internal defaults). */
  except?: string[];
}

/**
 * Wrap a Node `EventEmitter` so every `emit()` is captured by the Lens event
 * watcher (correlated to the current request). Internal `newListener`/
 * `removeListener` events are ignored by default.
 */
export function instrumentEmitter(
  emitter: { emit: (event: string | symbol, ...args: any[]) => any },
  options: InstrumentEmitterOptions = {},
): void {
  const originalEmit = emitter.emit.bind(emitter);
  const only = options.only;
  const except = [...(options.except ?? []), ...DEFAULT_EXCEPT];

  emitter.emit = ((event: string | symbol, ...args: any[]) => {
    try {
      const name = String(event);
      const skip = (only && !only.includes(name)) || except.includes(name);
      if (!skip) {
        emitLensEvent(name, args.length <= 1 ? args[0] : args);
      }
    } catch {
      // instrumentation must never break the emitter
    }
    return originalEmit(event, ...args);
  }) as typeof emitter.emit;
}
