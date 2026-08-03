import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { LogTableRow } from "../../types";
import useLog from "../../hooks/useLog";
import useListQuery from "../../hooks/useListQuery";

const LogTable = lazy(() => import("../../views/logs/LogTable"));

const LogContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useLog(params);
  const hasMoreObject = useLoadMore<LogTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <LogTable hasMoreObject={hasMoreObject} />;
};

export default LogContainer;
