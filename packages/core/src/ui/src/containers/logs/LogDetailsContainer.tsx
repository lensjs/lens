import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useLog from "../../hooks/useLog";
import { DetailSkeleton } from "../../components/Skeleton";

const LogDetailsView = lazy(() => import("../../views/logs/LogDetails"));

const LogDetailsContainer = () => {
  const { item, getItem } = useLog();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <LogDetailsView data={item} />;
};

export default LogDetailsContainer;
