import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useHttp from "../../hooks/useHttp";
import { DetailSkeleton } from "../../components/Skeleton";

const HttpDetailsView = lazy(() => import("../../views/http/HttpDetails"));

const HttpDetailsContainer = () => {
  const { item, getItem } = useHttp();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <HttpDetailsView data={item} />;
};

export default HttpDetailsContainer;
