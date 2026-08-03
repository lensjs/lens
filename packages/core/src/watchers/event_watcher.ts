import Watcher from "../core/watcher";
import { persistEntry } from "../utils/sampling";
import { EventEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class EventWatcher extends Watcher {
  name = WatcherTypeEnum.EVENT;

  async log(data: EventEntry) {
    await persistEntry({
      requestId: data.requestId ?? "",
      type: this.name,
      minimal_data: {
        name: data.name,
        payload: data.payload,
        createdAt: data.createdAt ?? nowISO(),
      },
      data,
    });
  }
}
