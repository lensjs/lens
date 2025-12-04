import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { ExceptionTableRow } from "../../types";
import useExceptions from "../../hooks/useExceptions";

const CacheEntriesTable = lazy(
  () => import("../../views/exceptions/ExceptionTable"),
);
const ExceptionContainer = () => {
  const { loadMoreItems, getItems } = useExceptions();
  const hasMoreObject = useLoadMore<ExceptionTableRow>({
    paginatedPage: loadMoreItems,
  });

  useEffect(() => {
    getItems();
  }, []);

  return <CacheEntriesTable hasMoreObject={hasMoreObject} />;
};

export default ExceptionContainer;
