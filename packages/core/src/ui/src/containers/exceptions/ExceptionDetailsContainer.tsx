import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useExceptions from "../../hooks/useExceptions";
import { DetailSkeleton } from "../../components/Skeleton";

const ExceptionView = lazy(
  () => import("../../views/exceptions/ExceptionDetails"),
);

const ExceptionDetailsContainer = () => {
  const { item, getItem } = useExceptions();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <ExceptionView data={item} />;
};

export default ExceptionDetailsContainer;
