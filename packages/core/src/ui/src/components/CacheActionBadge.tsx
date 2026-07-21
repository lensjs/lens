import type { CacheAction } from "../types";

const CacheActionBadge = ({ action }: { action: CacheAction }) => {
  const colors: Record<CacheAction, string> = {
    hit: "bg-success/10 text-success ring-success/20",
    miss: "bg-warning/10 text-warning ring-warning/20",
    write: "bg-info/10 text-info ring-info/20",
    delete: "bg-danger/10 text-danger ring-danger/20",
    clear: "bg-surface-2 text-muted ring-border",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${colors[action] || colors.clear}`}
    >
      {action}
    </span>
  );
};

export default CacheActionBadge;
