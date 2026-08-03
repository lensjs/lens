import Watcher from "../core/watcher";
import { persistEntry } from "../utils/sampling";
import { FcmEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class FcmWatcher extends Watcher {
  name = WatcherTypeEnum.FCM;

  async log(data: FcmEntry) {
    await persistEntry({
      requestId: data.requestId ?? "",
      type: this.name,
      minimal_data: {
        method: data.method,
        target: data.target,
        title: data.title,
        status: data.status,
        duration: data.duration,
        createdAt: data.createdAt ?? nowISO(),
      },
      data,
    });
  }
}
