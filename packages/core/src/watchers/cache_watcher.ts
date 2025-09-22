import { getStore } from "../context/context";
import Watcher from "../core/watcher";
import { CacheEntry, WatcherTypeEnum } from "../types";

export default class CacheWatcher extends Watcher {
  name = WatcherTypeEnum.CACHE;

  async log(data: CacheEntry) {
    const payload = {
      action: data.action,
      data: this.normalizePayload(data),
      requestId: data.requestId ?? "",
      createdAt: data.createdAt,
    };

    await getStore().save({
      requestId: data.requestId ?? "",
      type: this.name,
      data: payload,
      minimal_data: {
        action: data.action,
        key: payload.data.key,
        createdAt: payload.createdAt,
      },
    });
  }

  private normalizePayload(data: CacheEntry): { key: string; value: any } {
    let key = "";
    let value: any = "";

    if ("data" in data && typeof data.data === "object" && data.data !== null) {
      if ("key" in data.data) {
        key = String(data.data.key ?? "__");
      }
      if ("value" in data.data) {
        value = data.data.value;
      }
    } else if (typeof data.data === "string") {
      value = data.data;
    }

    return { key, value };
  }
}
