import { twMerge } from "tailwind-merge";
import type { HasMoreType } from "../types";

export function LoadMoreButton({
  paginatedPage,
}: {
  paginatedPage: HasMoreType<any>;
}) {
  if (!paginatedPage.hasMore) return null;

  return (
    <div className="flex justify-center p-4">
      <button
        onClick={paginatedPage.loadMore}
        disabled={paginatedPage.loading}
        className={twMerge(
          "px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-white text-sm hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors",
          paginatedPage.loading && "opacity-50 cursor-not-allowed"
        )}
      >
        {paginatedPage.loading ? "Loading..." : "Load More"}
      </button>
    </div>
  );
}
