import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useExceptions from "../../hooks/useExceptions";

const CacheEntryView = lazy(
  () => import("../../views/exceptions/ExceptionDetails"),
);

const ExceptionDetailsContainer = () => {
  const { item, getItem } = useExceptions();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  return <div>{item && <CacheEntryView data={item} />}</div>;
};

export default ExceptionDetailsContainer;
