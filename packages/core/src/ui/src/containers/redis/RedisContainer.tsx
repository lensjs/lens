import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { RedisTableRow } from "../../types";
import useRedis from "../../hooks/useRedis";
import useListQuery from "../../hooks/useListQuery";

const RedisTable = lazy(() => import("../../views/redis/RedisTable"));

const RedisContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useRedis(params);
  const hasMoreObject = useLoadMore<RedisTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <RedisTable hasMoreObject={hasMoreObject} />;
};

export default RedisContainer;
