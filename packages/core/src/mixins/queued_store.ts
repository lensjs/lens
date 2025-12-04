import Denque from "denque";
import {
  Constructor,
  QueuedStoreConfig,
  WatcherTypeEnum,
} from "../types/index";

export function QueuedStore<TBase extends Constructor>(Base: TBase) {
  return class Queued extends Base {
    public queue: Denque<{
      id?: string;
      data: Record<string, any>;
      minimal_data?: Record<string, any>;
      type: WatcherTypeEnum;
      timestamp?: string;
      requestId?: string;
    }>;

    public processingInterval: NodeJS.Timeout | null = null;

    public readonly BATCH_SIZE: number;
    public readonly PROCESS_INTERVAL_MS: number;
    public readonly WARN_THRESHOLD: number;
    public readonly PREALLOCATE: boolean;

    constructor(...args: any[]) {
      super(...args);

      const config: QueuedStoreConfig = args[0] || {};
      this.BATCH_SIZE = config.batchSize ?? 100;
      this.PROCESS_INTERVAL_MS = config.processIntervalMs ?? 100;
      this.WARN_THRESHOLD = config.warnThreshold ?? 100_000;
      this.PREALLOCATE = config.preallocate ?? true;

      // Preallocate Denque capacity to reduce growth overhead
      this.queue = this.PREALLOCATE
        ? new Denque([], { capacity: this.WARN_THRESHOLD * 2 })
        : new Denque();
    }

    public async initialize() {
      if (super["initialize"]) {
        await (super["initialize"] as any).call(this);
      }
      this.startProcessingQueue();

      process.on("SIGINT", () => this.shutdown());
      process.on("SIGTERM", () => this.shutdown());
    }

    public async truncate() {
      this.queue.clear();
      if (super["truncate"]) {
        await (super["truncate"] as any).call(this);
      }
    }

    public async save(entry: {
      id?: string;
      data: Record<string, any>;
      minimal_data?: Record<string, any>;
      type: WatcherTypeEnum;
      timestamp?: string;
      requestId?: string;
    }) {
      this.queue.push(entry);

      if (this.queue.length > this.WARN_THRESHOLD) {
        console.warn(`⚠️ LensJs Queue size very large: ${this.queue.length}`);
      }
    }

    public startProcessingQueue() {
      if (this.processingInterval) clearInterval(this.processingInterval);

      this.processingInterval = setInterval(
        () => this.processQueue(),
        this.PROCESS_INTERVAL_MS,
      );
    }

    public async processQueue() {
      if (this.queue.isEmpty()) return;

      // Optional: adaptive batch size
      const batchSize = Math.min(
        this.BATCH_SIZE,
        Math.max(10, Math.floor(this.queue.length / 10)),
      );

      const entriesToProcess = this.queue.remove(0, batchSize);
      if (!entriesToProcess.length) return;

      for (const entry of entriesToProcess) {
        super["save"]?.call(this, entry).catch((error: any) => {
          console.error("Error saving queued entry:", error);
        });
      }
    }

    public async stopProcessingQueue() {
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      if (!this.queue.isEmpty()) {
        await this.processQueue();
      }
    }

    public async shutdown() {
      await this.stopProcessingQueue();
      process.exit(0);
    }
  };
}
