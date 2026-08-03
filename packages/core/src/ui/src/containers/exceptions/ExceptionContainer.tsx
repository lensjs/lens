import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { ExceptionTableRow } from "../../types";
import useExceptions from "../../hooks/useExceptions";
import useListQuery from "../../hooks/useListQuery";

const ExceptionsTable = lazy(
  () => import("../../views/exceptions/ExceptionTable"),
);
const ExceptionGroups = lazy(
  () => import("../../views/exceptions/ExceptionGroups"),
);

const FlatExceptions = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useExceptions(params);
  const hasMoreObject = useLoadMore<ExceptionTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <ExceptionsTable hasMoreObject={hasMoreObject} />;
};

const ExceptionContainer = () => {
  const { params } = useListQuery();
  return params.group === "1" ? <ExceptionGroups /> : <FlatExceptions />;
};

export default ExceptionContainer;
