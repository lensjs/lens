import Watcher from "../core/watcher";
import { MailEntry, WatcherTypeEnum } from "../types";

export default class MailWatcher extends Watcher {
  name = WatcherTypeEnum.MAIL;

  async log(data: MailEntry) {
    console.log("data", data);
  }
}
