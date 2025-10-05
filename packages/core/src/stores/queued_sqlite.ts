import { QueuedStore } from "../mixins/queued_store";
import { compose } from "../utils/compose";
import BetterSqliteStore from "./better_sqlite";

export default class QueuedSqliteStore extends compose(
  BetterSqliteStore,
  QueuedStore,
) {}
