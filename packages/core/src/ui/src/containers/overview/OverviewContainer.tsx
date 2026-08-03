import { lazy } from "react";
import { useOverview } from "../../hooks/useTanstackApi";
import useListQuery from "../../hooks/useListQuery";
import { DetailSkeleton } from "../../components/Skeleton";

const OverviewView = lazy(() => import("../../views/overview/Overview"));

const OverviewContainer = () => {
  // The date range (from/to) lives in the URL; the backend defaults to the last
  // 24h when none is set. React Query refetches when the range changes.
  const { params } = useListQuery();
  const { data, isLoading } = useOverview(params);

  if (isLoading || !data?.data) return <DetailSkeleton />;

  return <OverviewView overview={data.data} />;
};

export default OverviewContainer;
