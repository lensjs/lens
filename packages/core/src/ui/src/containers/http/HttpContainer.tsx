import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { HttpTableRow } from "../../types";
import useHttp from "../../hooks/useHttp";

const HttpTable = lazy(() => import("../../views/http/HttpTable"));

const HttpContainer = () => {
  const { loadMoreItems, getItems } = useHttp();
  const hasMoreObject = useLoadMore<HttpTableRow>({
    paginatedPage: loadMoreItems,
  });

  useEffect(() => {
    getItems();
  }, []);

  return <HttpTable hasMoreObject={hasMoreObject} />;
};

export default HttpContainer;
