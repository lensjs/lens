import { convertToUTC, now } from "@lensjs/date";
import {
  Constructor,
  QueuedStoreConfig,
  WatcherTypeEnum,
} from "../types/index";

const DEFAULT_SWEEP_INTERVAL_MS = 5 * 60_000;

/**
 * Store mixin that periodically deletes entries older than a configured max age
 * (per signal type), via the store's `pruneOlderThan`. Composed alongside
 * `QueuedStore` so both the SQLite and SQL stores inherit identical behavior;
 * the sweep runs off the hot write path and is a no-op unless `retention` is set.
 */
export function RetentionStore<TBase extends Constructor>(Base: TBase) {
  return class Retention extends Base {
    public retentionInterval: NodeJS.Timeout | null = null;

    public async initialize() {
      if (super["initialize"]) {
        await (super["initialize"] as any).call(this);
      }
      this.startRetentionSweep();
    }

    public startRetentionSweep() {
      const retention = (this.storeConfig as QueuedStoreConfig | undefined)
        ?.retention;
      if (!retention) return;

      const hasPolicy =
        retention.defaultMaxAgeMs != null ||
        (!!retention.perType && Object.keys(retention.perType).length > 0);
      if (!hasPolicy) return;

      const intervalMs = retention.sweepIntervalMs ?? DEFAULT_SWEEP_INTERVAL_MS;

      if (this.retentionInterval) clearInterval(this.retentionInterval);
      this.retentionInterval = setInterval(() => {
        void this.runRetentionSweep();
      }, intervalMs);
      // Never keep the process alive just for the retention timer.
      this.retentionInterval.unref?.();
    }

    public async runRetentionSweep() {
      const retention = (this.storeConfig as QueuedStoreConfig | undefined)
        ?.retention;
      if (!retention) return;

      const nowMs = now().toMillis();

      for (const type of Object.values(WatcherTypeEnum)) {
        const maxAge = retention.perType?.[type] ?? retention.defaultMaxAgeMs;
        if (maxAge == null || !(maxAge > 0)) continue;

        const cutoffISO = convertToUTC(nowMs - maxAge);
        try {
          if (super["pruneOlderThan"]) {
            await (super["pruneOlderThan"] as any).call(this, cutoffISO, type);
          }
        } catch (error) {
          console.error("Lens retention sweep failed:", error);
        }
      }
    }

    public stopRetentionSweep() {
      if (this.retentionInterval) {
        clearInterval(this.retentionInterval);
        this.retentionInterval = null;
      }
    }
  };
}
