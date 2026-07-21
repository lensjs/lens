import { useEffect, useRef } from "react";
import type { HasMoreType } from "../types";

/**
 * Infinite-scroll sentinel. When it scrolls into view (with a generous
 * `rootMargin` so it pre-fetches before the user hits the bottom) it triggers
 * the next cursor page. A manual button is kept as a keyboard/no-IO fallback.
 */
export function LoadMoreButton({
  paginatedPage,
}: {
  paginatedPage: HasMoreType<unknown>;
}) {
  const { hasMore, loading, loadMore } = paginatedPage;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  if (!hasMore && !loading) return null;

  return (
    <div
      ref={sentinelRef}
      className="flex justify-center p-4 text-sm text-muted"
      aria-live="polite"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-strong border-t-fg" />
          Loading…
        </span>
      ) : (
        <button
          onClick={() => void loadMore()}
          className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface-2/60 px-5 py-2 font-medium text-fg transition-colors hover:border-accent/40 hover:bg-accent/10"
        >
          Load more
        </button>
      )}
    </div>
  );
}
