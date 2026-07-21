import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useRedis from "../../hooks/useRedis";
import { DetailSkeleton } from "../../components/Skeleton";

const RedisDetailsView = lazy(() => import("../../views/redis/RedisDetails"));

const RedisDetailsContainer = () => {
  const { item, getItem } = useRedis();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <RedisDetailsView data={item} />;
};

export default RedisDetailsContainer;
