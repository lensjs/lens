import { nowISO } from "@lensjs/date";
import { getStore } from "../context/context";
import Watcher from "../core/watcher";
import { MailEntry, WatcherTypeEnum } from "../types";

export default class MailWatcher extends Watcher {
  name = WatcherTypeEnum.MAIL;

  async log(data: MailEntry) {
    const recipientsCount =
      (data.to?.length ?? 0) + (data.cc?.length ?? 0) + (data.bcc?.length ?? 0);

    await getStore().save({
      requestId: data.requestId ?? "",
      type: this.name,
      minimal_data: {
        subject: data.subject ?? "",
        recipientsCount,
        createdAt: data.date ?? nowISO(),
      },
      data,
    });
  }
}
