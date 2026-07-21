import { lazy, useEffect } from "react";
import useQueries from "../../hooks/useQueries";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { QueryTableRow } from "../../types";

const QueriesTable = lazy(() => import("../../views/queries/QueryTable"));
const QueriesContainer = () => {
  const { loadMoreQueries, fetchQueries } = useQueries();
  const hasMoreObject = useLoadMore<QueryTableRow>({
    paginatedPage: loadMoreQueries,
  });

  useEffect(() => {
    fetchQueries();
  }, []);

  return <QueriesTable hasMoreObject={hasMoreObject}/>;
};

export default QueriesContainer;
