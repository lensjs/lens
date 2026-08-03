import { getStore } from "../context/context";
import Watcher from "../core/watcher";
import { LogEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class LogWatcher extends Watcher {
  name = WatcherTypeEnum.LOG;

  async log(data: LogEntry) {
    await getStore().save({
      requestId: data.requestId ?? "",
      type: this.name,
      minimal_data: {
        level: data.level,
        message: data.message,
        source: data.source,
        createdAt: data.createdAt ?? nowISO(),
      },
      data,
    });
  }
}
