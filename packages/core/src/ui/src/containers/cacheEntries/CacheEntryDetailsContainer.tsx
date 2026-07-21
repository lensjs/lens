import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useCacheEntries from "../../hooks/useCacheEntries";
import { DetailSkeleton } from "../../components/Skeleton";

const CacheEntryView = lazy(
  () => import("../../views/cache/CacheEntryDetails"),
);

const CacheEntryDetailsContainer = () => {
  const { item, getItem } = useCacheEntries();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <CacheEntryView data={item} />;
};

export default CacheEntryDetailsContainer;
