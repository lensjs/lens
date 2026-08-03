import { lazy, useEffect } from "react";
import useQueries from "../../hooks/useQueries";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { QueryTableRow } from "../../types";
import useListQuery from "../../hooks/useListQuery";

const QueriesTable = lazy(() => import("../../views/queries/QueryTable"));
const QueriesContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreQueries, fetchQueries } = useQueries(params);
  const hasMoreObject = useLoadMore<QueryTableRow>({
    paginatedPage: loadMoreQueries,
    live: !isCustomSort,
  });

  useEffect(() => {
    fetchQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <QueriesTable hasMoreObject={hasMoreObject} />;
};

export default QueriesContainer;
