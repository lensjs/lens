import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  X,
} from "lucide-react";
import SearchInput from "./SearchInput";
import DateRangePicker from "./DateRangePicker";
import StatsBar, { type Stat } from "./StatsBar";
import ExportMenu from "./ExportMenu";
import type {
  ListViewControls,
  FilterDef,
  SortDef,
} from "../hooks/useListView";

function Select({
  value,
  onChange,
  children,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-surface/70 px-3 py-2 text-sm text-fg transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none"
    >
      {children}
    </select>
  );
}

export default function ListToolbar<T>({
  controls,
  filters,
  sorts,
  stats,
  searchPlaceholder,
  hasGap,
  actions,
  exportName,
}: {
  controls: ListViewControls<T>;
  filters?: FilterDef<T>[];
  sorts?: SortDef<T>[];
  stats?: Stat[];
  searchPlaceholder?: string;
  hasGap?: boolean;
  /** Extra controls rendered on the right of the toolbar (e.g. a view toggle). */
  actions?: ReactNode;
  /** Filename base for the export menu; omit to hide export. */
  exportName?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      {hasGap && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle size={14} className="shrink-0" />
          High write volume — some entries were omitted from the live feed.
          Reload to resync.
        </div>
      )}
      {stats && stats.length > 0 && <StatsBar stats={stats} />}
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-48 flex-1">
          <SearchInput
            value={controls.q}
            onChange={controls.setQ}
            placeholder={searchPlaceholder ?? "Search…"}
          />
        </div>
        {filters?.map((filter) => (
          <Select
            key={filter.key}
            ariaLabel={filter.label}
            value={controls.filterValues[filter.key] ?? ""}
            onChange={(v) => controls.setFilter(filter.key, v)}
          >
            <option value="">{filter.label}: All</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}
        <DateRangePicker
          from={controls.from}
          to={controls.to}
          onChange={controls.setDateRange}
        />
        {sorts && sorts.length > 0 && (
          <div className="flex items-center gap-1">
            <Select
              ariaLabel="Sort by"
              value={controls.sortKey}
              onChange={controls.setSort}
            >
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort: {s.label}
                </option>
              ))}
            </Select>
            <button
              onClick={controls.toggleDir}
              title="Toggle sort direction"
              aria-label="Toggle sort direction"
              className="rounded-lg border border-border bg-surface/70 p-2 text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              {controls.dir === "asc" ? (
                <ArrowUpNarrowWide size={16} />
              ) : (
                <ArrowDownWideNarrow size={16} />
              )}
            </button>
          </div>
        )}
        {controls.activeCount > 0 && (
          <button
            onClick={controls.clear}
            title="Clear all filters"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface/70 px-2.5 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            <X size={14} />
            Clear ({controls.activeCount})
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ExportMenu rows={controls.rows} name={exportName} />
          {actions}
        </div>
      </div>
    </div>
  );
}
