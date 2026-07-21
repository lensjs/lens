import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useFcm from "../../hooks/useFcm";
import { DetailSkeleton } from "../../components/Skeleton";

const FcmDetailsView = lazy(() => import("../../views/fcm/FcmDetails"));

const FcmDetailsContainer = () => {
  const { item, getItem } = useFcm();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <FcmDetailsView data={item} />;
};

export default FcmDetailsContainer;
