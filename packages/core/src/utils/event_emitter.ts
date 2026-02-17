import { EventEmitter } from "events";
import { CacheEntry, MailEntry } from "../types";

type LensEvents = {
  cache: CacheEntry;
  mail: MailEntry;
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
