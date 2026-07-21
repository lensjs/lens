import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type FilterDef<T> = {
  key: string;
  label: string;
  get: (row: T) => string;
  options: { value: string; label: string }[];
};

export type SortDef<T> = {
  key: string;
  label: string;
  get: (row: T) => number;
};

export type ListViewConfig<T> = {
  search: (row: T) => (string | number | undefined)[];
  filters?: FilterDef<T>[];
  sorts?: SortDef<T>[];
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
  activeCount: number;
};

/**
 * Client-side, URL-synced search / filter / sort for accumulated list data.
 * State lives in the querystring so views are deep-linkable and shareable.
 */
export function useListView<T>(
  rows: T[],
  config: ListViewConfig<T>,
): ListViewControls<T> {
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const sortKey = params.get("sort") ?? config.sorts?.[0]?.key ?? "";
  const dir = (params.get("dir") as "asc" | "desc") ?? "desc";
  const paramsKey = params.toString();

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

  const processed = useMemo(() => {
    let out = rows;

    const term = q.trim().toLowerCase();
    if (term) {
      out = out.filter((row) =>
        config
          .search(row)
          .some(
            (value) =>
              value != null && String(value).toLowerCase().includes(term),
          ),
      );
    }

    for (const filter of config.filters ?? []) {
      const value = params.get(filter.key);
      if (value) out = out.filter((row) => filter.get(row) === value);
    }

    const sortDef = config.sorts?.find((s) => s.key === sortKey);
    if (sortDef) {
      out = [...out].sort((a, b) => {
        const av = sortDef.get(a);
        const bv = sortDef.get(b);
        return dir === "asc" ? av - bv : bv - av;
      });
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, paramsKey, sortKey, dir]);

  const filterValues = Object.fromEntries(
    (config.filters ?? []).map((f) => [f.key, params.get(f.key) ?? ""]),
  );
  const activeCount =
    (q ? 1 : 0) + Object.values(filterValues).filter(Boolean).length;

  return {
    rows: processed,
    q,
    setQ: (value) => patch({ q: value || null }),
    filterValues,
    setFilter: (key, value) => patch({ [key]: value || null }),
    sortKey,
    dir,
    setSort: (key) => patch({ sort: key }),
    toggleDir: () => patch({ dir: dir === "asc" ? "desc" : "asc" }),
    activeCount,
  };
}
