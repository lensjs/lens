import Watcher from "../core/watcher";
import { persistEntry } from "../utils/sampling";
import { LogEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class LogWatcher extends Watcher {
  name = WatcherTypeEnum.LOG;

  async log(data: LogEntry) {
    await persistEntry({
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
