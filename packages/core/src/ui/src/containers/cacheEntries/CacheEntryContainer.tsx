import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { CacheTableRow } from "../../types";
import useCacheEntries from "../../hooks/useCacheEntries";

const CacheEntriesTable = lazy(
  () => import("../../views/cache/CacheEntriesTable"),
);
const CacheEntryContainer = () => {
  const { loadMoreItems, getItems } = useCacheEntries();
  const hasMoreObject = useLoadMore<CacheTableRow>({
    paginatedPage: loadMoreItems,
  });

  useEffect(() => {
    getItems();
  }, []);

  return <CacheEntriesTable hasMoreObject={hasMoreObject} />;
};

export default CacheEntryContainer;
