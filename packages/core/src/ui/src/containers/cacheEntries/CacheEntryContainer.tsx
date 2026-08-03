import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { CacheTableRow } from "../../types";
import useCacheEntries from "../../hooks/useCacheEntries";
import useListQuery from "../../hooks/useListQuery";

const CacheEntriesTable = lazy(
  () => import("../../views/cache/CacheEntriesTable"),
);
const CacheEntryContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useCacheEntries(params);
  const hasMoreObject = useLoadMore<CacheTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <CacheEntriesTable hasMoreObject={hasMoreObject} />;
};

export default CacheEntryContainer;
