import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { HttpTableRow } from "../../types";
import useHttp from "../../hooks/useHttp";
import useListQuery from "../../hooks/useListQuery";

const HttpTable = lazy(() => import("../../views/http/HttpTable"));

const HttpContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useHttp(params);
  const hasMoreObject = useLoadMore<HttpTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <HttpTable hasMoreObject={hasMoreObject} />;
};

export default HttpContainer;
