import { lazy } from "react";
import { useParams } from "react-router-dom";
import { useRequestById } from "../../hooks/useTanstackApi";

const RequestDetailsTable = lazy(
  () => import("../../views/requests/RequestDetails"),
);

const RequestDetailsContainer = () => {
  const { id } = useParams();
  const { data } = useRequestById(id as string);

  return <>{data?.data && <RequestDetailsTable request={data?.data} />}</>;
};

export default RequestDetailsContainer;
