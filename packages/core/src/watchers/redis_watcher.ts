import Watcher from "../core/watcher";
import { getStore } from "../context/context";
import { RedisEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class RedisWatcher extends Watcher {
  name = WatcherTypeEnum.REDIS;

  async log(data: RedisEntry) {
    await getStore().save({
      requestId: data.requestId ?? "",
      type: this.name,
      minimal_data: {
        command: data.command,
        args: data.args,
        status: data.status,
        duration: data.duration,
        createdAt: data.createdAt ?? nowISO(),
      },
      data,
    });
  }
}
