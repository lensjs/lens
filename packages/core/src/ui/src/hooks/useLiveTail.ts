import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "../utils/context";
import { useRecordingPaused } from "./useRecording";
import { getToken } from "../utils/auth";
import { prepareApiUrl } from "../utils/api";
import { fetchJson, withQueryParams } from "../utils/apiClient";
import type { LiveEntry } from "../types";

const MAX_ITEMS = 500;
const POLL_MS = 3000;

export type LiveStatus = "connecting" | "live" | "polling" | "paused";

/**
 * Unified live-tail data source. Seeds with the newest entries, then streams
 * via SSE (`EventSource`); if SSE is unavailable/closed it transparently falls
 * back to delta polling. Both paths advance the same row cursor, so switching
 * between them never loses or duplicates entries.
 */
export default function useLiveTail() {
  const config = useConfig();
  const paused = useRecordingPaused();
  const [items, setItems] = useState<LiveEntry[]>([]);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [dropped, setDropped] = useState(0);
  const headRef = useRef<number>(0);

  const prepend = useCallback((batch: LiveEntry[]) => {
    if (!batch.length) return;
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.id));
      const fresh = batch.filter((i) => !seen.has(i.id));
      if (!fresh.length) return prev;
      const next = [...fresh, ...prev];
      return next.length > MAX_ITEMS ? next.slice(0, MAX_ITEMS) : next;
    });
  }, []);

  useEffect(() => {
    if (paused) {
      setStatus("paused");
      return;
    }

    let cancelled = false;
    let es: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (cancelled || pollTimer) return;
      setStatus("polling");
      const poll = async () => {
        try {
          const res = await fetchJson<LiveEntry[]>(
            prepareApiUrl(
              withQueryParams(config.api.streamPoll, {
                after: headRef.current || undefined,
              }),
            ),
          );
          if (cancelled) return;
          if (res.meta?.headCursor) {
            headRef.current = Math.max(headRef.current, res.meta.headCursor);
          }
          if (res.meta?.hasMore) setDropped((d) => d + 1);
          prepend(res.data ?? []);
        } catch {
          // transient; retried on the next tick
        }
      };
      pollTimer = setInterval(poll, POLL_MS);
    };

    const connectSse = () => {
      if (cancelled) return;
      const token = getToken();
      const url = withQueryParams(prepareApiUrl(config.api.stream), {
        token: token || undefined,
        after: headRef.current || undefined,
      });

      setStatus("connecting");
      es = new EventSource(url);

      es.addEventListener("open", () => !cancelled && setStatus("live"));

      es.addEventListener("entries", (e) => {
        try {
          const msg = e as MessageEvent;
          const id = Number(msg.lastEventId);
          if (Number.isInteger(id) && id > headRef.current) {
            headRef.current = id;
          }
          prepend(JSON.parse(msg.data) as LiveEntry[]);
        } catch {
          // ignore malformed frame
        }
      });

      es.addEventListener("gap", (e) => {
        try {
          const { dropped: n } = JSON.parse((e as MessageEvent).data);
          setDropped((d) => d + (Number(n) || 0));
        } catch {
          setDropped((d) => d + 1);
        }
      });

      es.onerror = () => {
        // CLOSED = the server rejected/doesn't support SSE -> fall back to
        // polling. Otherwise EventSource is auto-reconnecting.
        if (es && es.readyState === EventSource.CLOSED) {
          es.close();
          es = null;
          startPolling();
        } else if (!cancelled) {
          setStatus("connecting");
        }
      };
    };

    // Seed with the newest entries, then start streaming/polling.
    (async () => {
      try {
        const res = await fetchJson<LiveEntry[]>(
          prepareApiUrl(config.api.streamPoll),
        );
        if (cancelled) return;
        setItems((res.data ?? []).slice(0, MAX_ITEMS));
        if (res.meta?.headCursor) headRef.current = res.meta.headCursor;
      } catch {
        // seeding is best-effort
      }
      if (cancelled) return;
      if (typeof EventSource === "undefined") startPolling();
      else connectSse();
    })();

    return () => {
      cancelled = true;
      es?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [paused, config.api.stream, config.api.streamPoll, prepend]);

  return { items, status, dropped };
}
