import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type ListQuery = {
  /** Flat server-ready query params (search, date-range, sort, and field filters). */
  params: Record<string, string>;
  /** Serialized params, stable across renders — use as an effect dependency. */
  key: string;
  /**
   * True when an explicit sort is active (a non-time field, or time ascending),
   * which switches the store to offset ordering and must pause the live feed.
   */
  isCustomSort: boolean;
};

/**
 * Read the list controls (search / filters / date-range / sort) straight from
 * the URL so a container can fetch server-filtered data. The toolbar
 * (`useListView`) writes the same params, keeping the URL the single source of
 * truth without the container needing the per-view filter/sort definitions.
 */
export function useListQuery(): ListQuery {
  const [searchParams] = useSearchParams();
  const key = searchParams.toString();

  return useMemo(() => {
    const params = Object.fromEntries(searchParams.entries());
    const sort = params.sort;
    const dir = params.dir;
    const isCustomSort =
      (!!sort && sort !== "time") ||
      ((!sort || sort === "time") && dir === "asc");

    return { params, key, isCustomSort };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export default useListQuery;
