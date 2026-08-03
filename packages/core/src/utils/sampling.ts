import { getStore } from "../context/context";
import { lensContext, type LensSamplingState } from "./async_context";
import { flushTrace, recordTraceEntry } from "./tracing";
import type { LensSamplingConfig, StoreSaveEntry } from "../types/index";

/**
 * Persist a captured entry, honoring request-scoped sampling. When the current
 * request is being sampled-out, the entry is buffered until the request finishes
 * and is only written if an always-on rule keeps it. Watchers call this instead
 * of `getStore().save()` directly.
 *
 * `force` writes immediately AND marks the request to be kept — used for
 * exceptions, which are always valuable.
 */
export async function persistEntry(
  entry: StoreSaveEntry,
  opts?: { force?: boolean },
): Promise<void> {
  // Collect the entry onto the active trace (if tracing is enabled) regardless
  // of the sampling decision; the trace is only exported if the request is kept.
  recordTraceEntry(entry);

  const state = lensContext.getStore()?.sampling;

  if (state?.pending) {
    if (opts?.force) {
      state.keep = true;
    } else {
      state.buffer.push(entry);
      return;
    }
  }

  await getStore().save(entry);
}

/**
 * Roll the sampling rate at request start. Returns a buffering state when the
 * request should be sampled-out (its entries are held until `finalizeSampling`),
 * or `undefined` to capture the request normally.
 */
export function createSamplingState(
  sampling?: LensSamplingConfig,
): LensSamplingState | undefined {
  if (!sampling) return undefined;

  const rate = sampling.rate;
  if (rate == null || rate >= 1) return undefined; // capture everything
  if (rate > 0 && Math.random() < rate) return undefined; // sampled in

  return { pending: true, keep: false, buffer: [] };
}

/**
 * Flush or discard a sampled-out request's buffered entries based on its final
 * status/duration and the always-on rules. Adapters call this once the response
 * has completed. A no-op when the request was not sampled-out.
 */
export async function finalizeSampling(
  status: number,
  durationMs: number,
  sampling?: LensSamplingConfig,
): Promise<boolean> {
  const state = lensContext.getStore()?.sampling;
  if (!state || !state.pending) return true;

  state.pending = false;

  const onErrors = sampling?.alwaysOnErrors !== false;
  const keep =
    state.keep ||
    (onErrors && status >= 500) ||
    (sampling?.alwaysOnSlowMs != null && durationMs >= sampling.alwaysOnSlowMs);

  const buffered = state.buffer;
  state.buffer = [];
  if (!keep) return false;

  const store = getStore();
  for (const entry of buffered) {
    try {
      await store.save(entry);
    } catch (err) {
      console.error("Lens: failed to flush sampled entry", err);
    }
  }

  return true;
}

/**
 * Finalize capture for a completed request: apply the sampling decision and,
 * when the request is kept, flush its collected trace to the registered sink.
 * Adapters call this once the response has completed.
 */
export async function finalizeCapture(
  status: number,
  durationMs: number,
  sampling?: LensSamplingConfig,
): Promise<void> {
  const kept = await finalizeSampling(status, durationMs, sampling);
  if (kept) await flushTrace();
}
