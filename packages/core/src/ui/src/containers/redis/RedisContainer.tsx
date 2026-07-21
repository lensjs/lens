import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { RedisTableRow } from "../../types";
import useRedis from "../../hooks/useRedis";

const RedisTable = lazy(() => import("../../views/redis/RedisTable"));

const RedisContainer = () => {
  const { loadMoreItems, getItems } = useRedis();
  const hasMoreObject = useLoadMore<RedisTableRow>({
    paginatedPage: loadMoreItems,
  });

  useEffect(() => {
    getItems();
  }, []);

  return <RedisTable hasMoreObject={hasMoreObject} />;
};

export default RedisContainer;
