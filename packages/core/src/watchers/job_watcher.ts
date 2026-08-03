import { getStore } from "../context/context";
import Watcher from "../core/watcher";
import { JobEntry, WatcherTypeEnum } from "../types";
import { nowISO } from "@lensjs/date";

export default class JobWatcher extends Watcher {
  name = WatcherTypeEnum.JOB;

  async log(data: JobEntry) {
    const createdAt = data.createdAt ?? nowISO();

    // A stable `id` + `timestamp` are what let the store upsert the same row as
    // the job moves from active -> completed/failed (see BetterSqliteStore.save).
    await getStore().save({
      id: data.id,
      requestId: data.requestId ?? "",
      type: this.name,
      timestamp: createdAt,
      minimal_data: {
        name: data.name,
        queue: data.queue,
        status: data.status,
        attempts: data.attempts,
        duration: data.duration,
        createdAt,
      },
      data,
    });
  }
}
