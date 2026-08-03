import { getNotifier, getStore } from "../context/context";
import Watcher from "../core/watcher";
import { ExceptionEntry, WatcherTypeEnum } from "../types";
import { generateRandomUuid } from "../utils";

export default class ExceptionWatcher extends Watcher {
  name = WatcherTypeEnum.EXCEPTION;

  async log(payload: ExceptionEntry) {
    const id = generateRandomUuid();

    await getStore().save({
      id,
      type: WatcherTypeEnum.EXCEPTION,
      requestId: payload.requestId,
      timestamp: payload.createdAt,
      data: payload,
      minimal_data: {
        name: payload.name,
        message: payload.message,
        fingerprint: payload.fingerprint,
        createdAt: payload.createdAt,
      },
    });

    // Fire configured outbound alerts (non-blocking; never breaks capture).
    try {
      getNotifier()?.notifyException({ ...payload, id });
    } catch (err) {
      console.error("Lens: alert notification failed", err);
    }
  }
}
