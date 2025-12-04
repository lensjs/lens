import type { CacheAction } from "../types";

const CacheActionBadge = ({ action }: { action: CacheAction }) => {
  const colors: Record<CacheAction, string> = {
    hit: "bg-green-100 text-green-800 dark:bg-green-600 dark:text-white",
    miss: "bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white",
    write: "bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white",
    delete: "bg-red-100 text-red-800 dark:bg-red-600 dark:text-white",
    clear: "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-white",
  };

  return (
    <span
      className={`rounded px-2 py-1 text-sm font-semibold ${
        colors[action] || colors.clear
      }`}
    >
      {action}
    </span>
  );
};

export default CacheActionBadge;
