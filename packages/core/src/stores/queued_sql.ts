import { QueuedStore } from "../mixins/queued_store";
import { RetentionStore } from "../mixins/retention_store";
import { compose } from "../utils/compose";
import SqlStore from "./sql/sql_store";

/**
 * PostgreSQL / MySQL store with the batched write queue applied — the
 * production analogue of `QueuedSqliteStore`. Pass it to `Lens.setStore(...)`.
 */
export default class QueuedSqlStore extends compose(
  SqlStore,
  QueuedStore,
  RetentionStore,
) {}
