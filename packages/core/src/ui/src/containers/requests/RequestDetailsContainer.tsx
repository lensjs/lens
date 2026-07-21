import { lazy } from "react";
import { useParams } from "react-router-dom";
import { useRequestById } from "../../hooks/useTanstackApi";
import { DetailSkeleton } from "../../components/Skeleton";

const RequestDetailsTable = lazy(
  () => import("../../views/requests/RequestDetails"),
);

const RequestDetailsContainer = () => {
  const { id } = useParams();
  const { data, isLoading } = useRequestById(id as string);

  if (isLoading) return <DetailSkeleton />;

  return <>{data?.data && <RequestDetailsTable request={data?.data} />}</>;
};

export default RequestDetailsContainer;
