import { persistEntry } from "../utils/sampling";
import Watcher from "../core/watcher";
import { WatcherTypeEnum, type QueryEntry } from "../types/index";

export default class QueryWatcher extends Watcher {
  name = WatcherTypeEnum.QUERY;

  async log(entry: QueryEntry) {
    await persistEntry({
      type: this.name,
      data: entry.data,
      requestId: entry.requestId ?? "",
    });
  }
}
