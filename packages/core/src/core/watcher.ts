import type { WatcherTypeEnum } from "../types";

export default abstract class Watcher {
  abstract name: WatcherTypeEnum;
  abstract log(data: any): Promise<void>;
}
