import { EventEmitter } from "events";
import {
  CacheEntry,
  EventEntry,
  FcmEntry,
  HttpEntry,
  JobEntry,
  LensEntry,
  LogEntry,
  MailEntry,
  RedisEntry,
} from "../types";

type LensEvents = {
  cache: CacheEntry;
  mail: MailEntry;
  http: HttpEntry;
  event: EventEntry;
  redis: RedisEntry;
  fcm: FcmEntry;
  log: LogEntry;
  job: JobEntry;
};

/** A single persisted entry pushed to the live-tail stream (SSE). */
export type LensStreamMessage = {
  /** Monotonic row cursor (doubles as the SSE `Last-Event-ID`). */
  cursor: number;
  entry: LensEntry;
};

type LensStreamEvents = {
  entry: LensStreamMessage;
};

class TypedEventEmitter<T extends Record<string, any>> {
  public emitter = new EventEmitter();

  on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
    this.emitter.on(event as string, listener);
    return this;
  }

  off<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
    this.emitter.off(event as string, listener);
    return this;
  }

  once<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
    this.emitter.once(event as string, listener);
    return this;
  }

  emit<K extends keyof T>(event: K, payload: T[K]): boolean {
    return this.emitter.emit(event as string, payload);
  }
}

export const createEmittery = <T extends Record<string, any>>() => {
  return new TypedEventEmitter<T>();
};

export const lensEmitter = createEmittery<LensEvents>();

/**
 * A single in-process stream of every persisted entry, used to power the
 * live-tail SSE endpoint. Emitted by the store right after a successful write.
 */
export const lensStream = createEmittery<LensStreamEvents>();
