import Watcher from "../core/watcher";
import { getStore } from "../context/context";
import { FcmEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class FcmWatcher extends Watcher {
  name = WatcherTypeEnum.FCM;

  async log(data: FcmEntry) {
    await getStore().save({
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
