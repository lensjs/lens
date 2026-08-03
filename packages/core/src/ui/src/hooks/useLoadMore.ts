import { useCallback, useEffect, useRef, useState } from "react";
import type { HasMoreType } from "../types";
import type { UseLoadMoreOptions } from "../interfaces";
import { useRecordingPaused } from "./useRecording";

const LIVE_POLL_INTERVAL_MS = 3000;

const entryId = (row: unknown): string | number | undefined =>
  (row as { id?: string | number } | null)?.id;

const dedupePrepend = <T>(prev: T[], incoming: T[]): T[] => {
  if (!incoming.length) return prev;
  // Replace already-seen rows in place (so an upserted entry — e.g. a job going
  // active -> completed — updates live) and prepend the genuinely new ones.
  const byId = new Map(incoming.map((row) => [entryId(row), row]));
  const merged = prev.map((row) => byId.get(entryId(row)) ?? row);
  const prevIds = new Set(prev.map(entryId));
  const fresh = incoming.filter((row) => !prevIds.has(entryId(row)));
  return fresh.length ? [...fresh, ...merged] : merged;
};

const dedupeAppend = <T>(prev: T[], incoming: T[]): T[] => {
  const existing = new Set(prev.map(entryId));
  const fresh = incoming.filter((row) => !existing.has(entryId(row)));
  return fresh.length ? [...prev, ...fresh] : prev;
};

/**
 * Cursor-paginated, infinite-scroll data source with a Telescope-style live
 * feed backed by delta polling.
 *
 * - Older pages (infinite scroll) are fetched with `cursor` = the tail row id.
 * - The live feed polls with `after` = the newest row id already seen, so each
 *   poll transfers only newly-captured entries (not the whole page). If more
 *   entries arrived than a single poll can return, `hasGap` is raised so the UI
 *   can tell the user the feed is sampling under high write volume.
 */
export function useLoadMore<T>({
  paginatedPage,
  live = true,
}: UseLoadMoreOptions<T>): HasMoreType<T> {
  const [data, setData] = useState<T[]>([]);
  const [olderCursor, setOlderCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [hasGap, setHasGap] = useState<boolean>(false);
  // Ref (not state) so the poll always reads the latest head without
  // tearing down/recreating the interval on every new entry.
  const headCursorRef = useRef<number | null>(null);
  const paused = useRecordingPaused();

  const fetchRawPage = paginatedPage.fetchRawPage;

  useEffect(() => {
    setLoading(paginatedPage.loading);
    setHasMore(paginatedPage.meta.hasMore);
    setOlderCursor(paginatedPage.meta.nextCursor);
    headCursorRef.current = paginatedPage.meta.headCursor;

    if (!paginatedPage.loading) {
      setData(paginatedPage.initialData);
      setHasGap(false);
    }
  }, [
    paginatedPage.initialData,
    paginatedPage.loading,
    paginatedPage.meta.hasMore,
    paginatedPage.meta.nextCursor,
    paginatedPage.meta.headCursor,
  ]);

  // Live feed: delta-poll only entries newer than the head cursor and prepend
  // them. Paused via the global recording toggle (Telescope-style) or when an
  // explicit sort switches the view to offset pagination.
  useEffect(() => {
    if (paused || !live) return;

    let active = true;
    const poll = async () => {
      try {
        const res = await fetchRawPage(null, headCursorRef.current);
        if (!active || !res) return;

        const incoming = (res.data as T[]) ?? [];
        if (incoming.length) {
          setData((prev) => dedupePrepend(prev, incoming));
        }
        if (res.meta?.headCursor != null) {
          headCursorRef.current = res.meta.headCursor;
        }
        // Delta paging sets `hasMore` when more new entries arrived than a
        // single poll returns — i.e. the live feed has a hole.
        if (res.meta?.hasMore) {
          setHasGap(true);
        }
      } catch {
        // transient fetch errors shouldn't break the live feed
      }
    };

    const interval = setInterval(poll, LIVE_POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [paused, live, fetchRawPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || olderCursor == null) return;

    setLoading(true);
    try {
      const res = await fetchRawPage(olderCursor);
      const incoming = (res?.data as T[]) ?? [];
      setData((prev) => dedupeAppend(prev, incoming));
      setHasMore(!!res?.meta?.hasMore);
      setOlderCursor(res?.meta?.nextCursor ?? null);
    } catch {
      // keep current state; the sentinel will retry on the next intersection
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, olderCursor, fetchRawPage]);

  return { data, loading, hasMore, loadMore, hasGap };
}
