import type { JobStatus } from "@lensjs/core";
import { capPayload, emitLensJob, type EmitJobInput } from "./shared";

/** Minimal structural type so `agenda` stays an optional dependency. */
export interface LensAgenda {
  on: (event: string, listener: (...args: any[]) => void) => any;
  [key: string]: any;
}

export interface AttachAgendaLensOptions {
  /** Capture job `data` (capped). Default: true. */
  includeData?: boolean;
}

const QUEUE = "agenda";

function base(job: any, status: JobStatus, includeData: boolean): EmitJobInput {
  const attrs = job?.attrs ?? {};
  return {
    id: `${QUEUE}:${String(attrs._id ?? "")}`,
    name: String(attrs.name ?? "job"),
    queue: QUEUE,
    status,
    attempts: typeof attrs.failCount === "number" ? attrs.failCount : undefined,
    data: includeData ? capPayload(attrs.data) : undefined,
    requestId: attrs.data?.__lensRequestId,
    createdAt: attrs.lastRunAt
      ? new Date(attrs.lastRunAt).toISOString()
      : undefined,
  };
}

function durationOf(job: any): string | undefined {
  const attrs = job?.attrs ?? {};
  if (attrs.lastFinishedAt && attrs.lastRunAt) {
    const ms =
      new Date(attrs.lastFinishedAt).getTime() -
      new Date(attrs.lastRunAt).getTime();
    return `${Math.max(0, ms)} ms`;
  }
  return undefined;
}

/**
 * Instrument an `Agenda` instance so each job is captured by the Lens job
 * watcher as it moves active -> completed/failed. Returns the same instance.
 */
export function attachAgendaLens<T extends LensAgenda>(
  agenda: T,
  options: AttachAgendaLensOptions = {},
): T {
  if (!agenda || typeof agenda.on !== "function") return agenda;
  const includeData = options.includeData ?? true;

  agenda.on("start", (job: any) =>
    emitLensJob(base(job, "active", includeData)),
  );

  agenda.on("success", (job: any) =>
    emitLensJob({
      ...base(job, "completed", includeData),
      duration: durationOf(job),
    }),
  );

  agenda.on("fail", (error: any, job: any) =>
    emitLensJob({
      ...base(job, "failed", includeData),
      duration: durationOf(job),
      failedReason: error instanceof Error ? error.message : String(error ?? ""),
    }),
  );

  return agenda;
}
