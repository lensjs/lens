import Watcher from "../core/watcher";
import { MailEntry, WatcherTypeEnum } from "../types";

export default class MailWatcher extends Watcher {
    name =  WatcherTypeEnum.MAIL;

    override async log(data: MailEntry): Promise<void> {
        console.log('Mail Entry', data)

        return Promise.resolve();
    }
}
