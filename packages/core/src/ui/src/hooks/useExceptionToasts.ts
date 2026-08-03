import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../utils/context";
import { useRecordingPaused } from "./useRecording";
import { getToken } from "../utils/auth";
import { prepareApiUrl } from "../utils/api";
import { fetchJson, withQueryParams } from "../utils/apiClient";
import { getRoutesPaths } from "../router/routes";
import { pushToast } from "../utils/toast";
import type { LiveEntry } from "../types";

/**
 * Surface newly-captured exceptions as toasts, fed by the live SSE stream. Seeds
 * the cursor first so the historical backfill is never toasted, dedupes by
 * fingerprint for the session, respects the recording-paused toggle, and
 * deep-links to the exception on click.
 */
export function useExceptionToasts(): void {
  const config = useConfig();
  const paused = useRecordingPaused();
  const navigate = useNavigate();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (paused || typeof EventSource === "undefined") return;

    let cancelled = false;
    let es: EventSource | null = null;
    let head = 0;
    const paths = getRoutesPaths(config);

    const handleEntries = (entries: LiveEntry[]) => {
      for (const entry of entries) {
        if (entry.type !== "exception") continue;
        const data = (entry.data ?? {}) as Record<string, any>;
        const key = String(
          data.fingerprint ?? `${data.name}:${data.message}`,
        );
        if (seen.current.has(key)) continue;
        seen.current.add(key);

        pushToast({
          title: String(data.name ?? "Exception"),
          description: data.message ? String(data.message) : undefined,
          onClick: () => navigate(`${paths.EXCEPTIONS}/${entry.id}`),
        });
      }
    };

    void (async () => {
      // Seed the cursor so only entries newer than "now" are streamed (skips the
      // backfill of already-seen exceptions on page load).
      try {
        const res = await fetchJson<LiveEntry[]>(
          prepareApiUrl(config.api.streamPoll),
        );
        if (cancelled) return;
        if (res.meta?.headCursor) head = res.meta.headCursor;
      } catch {
        // best-effort seed
      }
      if (cancelled) return;

      const token = getToken();
      const url = withQueryParams(prepareApiUrl(config.api.stream), {
        token: token || undefined,
        after: head || undefined,
      });

      es = new EventSource(url);
      es.addEventListener("entries", (e) => {
        try {
          handleEntries(JSON.parse((e as MessageEvent).data) as LiveEntry[]);
        } catch {
          // ignore malformed frame
        }
      });
      // On error EventSource auto-reconnects; toasts need no polling fallback.
    })();

    return () => {
      cancelled = true;
      es?.close();
    };
  }, [paused, config, navigate]);
}
