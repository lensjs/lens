import { cn } from "../../utils/cn";

export type BarItem = {
  label: string;
  value: number;
  sub?: string;
  title?: string;
  onClick?: () => void;
};

/**
 * A ranked horizontal bar list — each row has a proportional background fill.
 * Rows are clickable when `onClick` is provided (e.g. to deep-link into a
 * filtered list). Theme tokens only.
 */
export default function BarList({
  items,
  formatValue = (v) => String(v),
  emptyLabel = "No data in this range.",
}: {
  items: BarItem[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (!items.length) {
    return <p className="px-4 py-6 text-center text-sm text-muted">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="divide-y divide-border">
      {items.map((item, idx) => (
        <li key={idx}>
          <button
            type="button"
            onClick={item.onClick}
            disabled={!item.onClick}
            title={item.title ?? item.label}
            className={cn(
              "relative flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left",
              item.onClick && "transition-colors hover:bg-surface-2/50",
            )}
          >
            <span
              className="absolute inset-y-1 left-0 rounded-r-md bg-accent/10"
              style={{ width: `${(item.value / max) * 100}%` }}
              aria-hidden
            />
            <span
              className="relative min-w-0 flex-1 truncate font-mono text-sm text-fg"
            >
              {item.label}
            </span>
            <span className="relative flex shrink-0 items-center gap-2">
              {item.sub && <span className="text-xs text-dim">{item.sub}</span>}
              <span className="text-sm font-semibold tabular text-fg">
                {formatValue(item.value)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
