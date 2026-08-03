import { useSearchParams } from "react-router-dom";

export type FilterDef<T> = {
  key: string;
  label: string;
  /** Optional row accessor, kept for client-side stats; unused for fetching. */
  get?: (row: T) => string;
  options: { value: string; label: string }[];
  /** URL/query param keys this filter owns (cleared together). Default: [key]. */
  paramKeys?: string[];
  /** Map a selected option value -> server query params. Default: { [key]: value }. */
  toParams?: (value: string) => Record<string, string>;
  /** Derive the selected option value from the URL. Default: params.get(key). */
  fromParams?: (params: URLSearchParams) => string;
};

export type SortDef<T> = {
  key: string;
  label: string;
  /** Optional row accessor, kept for client-side stats; unused for fetching. */
  get?: (row: T) => number;
  /** Sort this field numerically on the server (CAST to REAL) instead of as text. */
  numeric?: boolean;
};

export type ListViewConfig<T> = {
  search?: (row: T) => (string | number | undefined)[];
  filters?: FilterDef<T>[];
  sorts?: SortDef<T>[];
  /**
   * Extra URL params that scope the list without a toolbar control (e.g. a
   * drill-down `fingerprint`). They count toward `activeCount` and are removed
   * by `clear()`, so the Clear button appears and resets them.
   */
  extraParams?: string[];
};

export type ListViewControls<T> = {
  rows: T[];
  q: string;
  setQ: (value: string) => void;
  filterValues: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  sortKey: string;
  dir: "asc" | "desc";
  setSort: (key: string) => void;
  toggleDir: () => void;
  from: string;
  to: string;
  setDateRange: (from: string | null, to: string | null) => void;
  clear: () => void;
  activeCount: number;
};

/**
 * URL-synced controls for a server-filtered list. Search, field filters,
 * date-range, and sort are written to the querystring (so views stay
 * deep-linkable) and read back by the container's `useListQuery` to drive the
 * fetch — this hook no longer filters or sorts rows on the client.
 */
export function useListView<T>(
  rows: T[],
  config: ListViewConfig<T>,
): ListViewControls<T> {
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const sortKey = params.get("sort") ?? config.sorts?.[0]?.key ?? "";
  const dir = (params.get("dir") as "asc" | "desc") ?? "desc";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const filters = config.filters ?? [];
  const extraParams = config.extraParams ?? [];

  const patch = (changes: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const filterValues = Object.fromEntries(
    filters.map((f) => [
      f.key,
      f.fromParams ? f.fromParams(params) : (params.get(f.key) ?? ""),
    ]),
  );

  const setFilter = (key: string, value: string) => {
    const def = filters.find((f) => f.key === key);
    const owned = def?.paramKeys ?? [key];
    const changes: Record<string, string | null> = {};
    for (const k of owned) changes[k] = null;
    const mapped = value
      ? def?.toParams
        ? def.toParams(value)
        : { [key]: value }
      : {};
    Object.assign(changes, mapped);
    patch(changes);
  };

  const setSort = (key: string) => {
    const def = config.sorts?.find((s) => s.key === key);
    patch({ sort: key, numericSort: def?.numeric ? "true" : null });
  };

  const clear = () => {
    const changes: Record<string, string | null> = {
      q: null,
      from: null,
      to: null,
    };
    for (const f of filters) {
      for (const k of f.paramKeys ?? [f.key]) changes[k] = null;
    }
    for (const k of extraParams) changes[k] = null;
    patch(changes);
  };

  const activeCount =
    (q ? 1 : 0) +
    Object.values(filterValues).filter(Boolean).length +
    (from || to ? 1 : 0) +
    extraParams.filter((k) => params.get(k)).length;

  return {
    rows,
    q,
    setQ: (value) => patch({ q: value || null }),
    filterValues,
    setFilter,
    sortKey,
    dir,
    setSort,
    toggleDir: () => patch({ dir: dir === "asc" ? "desc" : "asc" }),
    from,
    to,
    setDateRange: (f, t) => patch({ from: f || null, to: t || null }),
    clear,
    activeCount,
  };
}
