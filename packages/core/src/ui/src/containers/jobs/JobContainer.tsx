import { lazy, useEffect } from "react";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { JobTableRow } from "../../types";
import useJob from "../../hooks/useJob";
import useListQuery from "../../hooks/useListQuery";

const JobTable = lazy(() => import("../../views/jobs/JobTable"));

const JobContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreItems, getItems } = useJob(params);
  const hasMoreObject = useLoadMore<JobTableRow>({
    paginatedPage: loadMoreItems,
    live: !isCustomSort,
  });

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <JobTable hasMoreObject={hasMoreObject} />;
};

export default JobContainer;
