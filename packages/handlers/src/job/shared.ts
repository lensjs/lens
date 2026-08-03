import {
  getCurrentRequestId,
  lensEmitter,
  type JobEntry,
  type JobStatus,
} from "@lensjs/core";
import { nowISO } from "@lensjs/date";

const MAX_PAYLOAD = 10_000;

export type { JobStatus };

export type EmitJobInput = Omit<JobEntry, "createdAt" | "requestId"> & {
  createdAt?: string;
  requestId?: string;
};

/** Cap a job payload/result so large blobs never reach the store. */
export function capPayload(value: unknown): unknown {
  if (value === undefined) return undefined;
  try {
    const json = JSON.stringify(value);
    if (json && json.length > MAX_PAYLOAD) {
      return { __truncated: true, preview: json.slice(0, MAX_PAYLOAD) };
    }
    return value;
  } catch {
    return String(value);
  }
}

/**
 * Emit a job entry to the Lens job watcher. The `id` (`${queue}:${jobId}`) is
 * stable across a job's lifecycle so the store upserts one row per job. Used by
 * the driver integrations and available for custom queue systems.
 */
export function emitLensJob(input: EmitJobInput): void {
  try {
    lensEmitter.emit("job", {
      ...input,
      requestId: input.requestId ?? getCurrentRequestId(),
      createdAt: input.createdAt ?? nowISO(),
    });
  } catch {
    // instrumentation must never break the queue
  }
}
