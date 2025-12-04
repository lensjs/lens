import { CacheEntry, lensContext, lensEmitter } from "@lensjs/core";
import { nowISO } from "@lensjs/date";

export const emitCacheEvent = (data: Omit<CacheEntry, "requestId" | 'createdAt'>) => {
  lensEmitter.emit("cache", {
    action: data.action,
    createdAt: nowISO(),
    data: "data" in data ? (data.data as any) : {},
    requestId: lensContext.getStore()?.requestId,
  });
};
