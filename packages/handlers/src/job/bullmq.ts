import type { JobStatus } from "@lensjs/core";
import { capPayload, emitLensJob, type EmitJobInput } from "./shared";

/** Minimal structural type so `bullmq` stays an optional dependency. */
export interface LensBullmqWorker {
  on: (event: string, listener: (...args: any[]) => void) => any;
  name?: string;
  [key: string]: any;
}

export interface AttachBullmqLensOptions {
  /** Capture job `data` and results (capped). Default: true. */
  includeData?: boolean;
}

function identity(job: any, worker: LensBullmqWorker) {
  const queue = String(job?.queueName ?? worker?.name ?? "default");
  return { queue, id: `${queue}:${String(job?.id ?? "")}` };
}

function base(
  job: any,
  worker: LensBullmqWorker,
  status: JobStatus,
  includeData: boolean,
): EmitJobInput {
  const { queue, id } = identity(job, worker);
  return {
    id,
    name: String(job?.name ?? "job"),
    queue,
    status,
    attempts:
      typeof job?.attemptsMade === "number" ? job.attemptsMade : undefined,
    data: includeData ? capPayload(job?.data) : undefined,
    requestId: job?.data?.__lensRequestId,
    createdAt: job?.timestamp
      ? new Date(job.timestamp).toISOString()
      : undefined,
  };
}

function durationOf(job: any): string | undefined {
  if (job?.finishedOn && job?.processedOn) {
    return `${Math.max(0, job.finishedOn - job.processedOn)} ms`;
  }
  return undefined;
}

/**
 * Instrument a BullMQ `Worker` so each job is captured by the Lens job watcher
 * as it moves active -> completed/failed. The job's stable id keeps it a single
 * live-updating row. Returns the same worker.
 */
export function attachBullmqLens<T extends LensBullmqWorker>(
  worker: T,
  options: AttachBullmqLensOptions = {},
): T {
  if (!worker || typeof worker.on !== "function") return worker;
  const includeData = options.includeData ?? true;

  worker.on("active", (job: any) =>
    emitLensJob(base(job, worker, "active", includeData)),
  );

  worker.on("completed", (job: any, result: unknown) =>
    emitLensJob({
      ...base(job, worker, "completed", includeData),
      duration: durationOf(job),
      result: includeData ? capPayload(result) : undefined,
    }),
  );

  worker.on("failed", (job: any, error: unknown) =>
    emitLensJob({
      ...base(job, worker, "failed", includeData),
      duration: durationOf(job),
      failedReason:
        error instanceof Error
          ? error.message
          : String(job?.failedReason ?? error ?? ""),
    }),
  );

  return worker;
}
