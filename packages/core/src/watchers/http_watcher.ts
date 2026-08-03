import Watcher from "../core/watcher";
import { persistEntry } from "../utils/sampling";
import { HttpEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class HttpWatcher extends Watcher {
  name = WatcherTypeEnum.HTTP;

  async log(data: HttpEntry) {
    await persistEntry({
      requestId: data.requestId ?? "",
      type: this.name,
      minimal_data: {
        method: data.method,
        url: data.url,
        status: data.status,
        duration: data.duration,
        createdAt: data.createdAt ?? nowISO(),
      },
      data,
    });
  }
}
