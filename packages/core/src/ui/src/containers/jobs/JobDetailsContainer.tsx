import { lazy, useEffect } from "react";
import { useParams } from "react-router-dom";
import useJob from "../../hooks/useJob";
import { DetailSkeleton } from "../../components/Skeleton";

const JobDetailsView = lazy(() => import("../../views/jobs/JobDetails"));

const JobDetailsContainer = () => {
  const { item, getItem } = useJob();
  const { id } = useParams();

  useEffect(() => {
    id && getItem(id);
  }, [id]);

  if (!item) return <DetailSkeleton />;

  return <JobDetailsView data={item} />;
};

export default JobDetailsContainer;
