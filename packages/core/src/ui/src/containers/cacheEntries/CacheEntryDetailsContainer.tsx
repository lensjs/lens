import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useCacheEntries from "../../hooks/useCacheEntries";

const CacheEntryView = lazy(
  () => import("../../views/cache/CacheEntryDetails"),
);

const CacheEntryDetailsContainer = () => {
  const { item, getItem } = useCacheEntries();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  return <div>{item && <CacheEntryView data={item} />}</div>;
};

export default CacheEntryDetailsContainer;
