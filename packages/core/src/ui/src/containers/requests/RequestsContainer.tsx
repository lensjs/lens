import { lazy, useEffect } from "react";
import useRequests from "../../hooks/useRequests";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { RequestTableRow } from "../../types";
import useListQuery from "../../hooks/useListQuery";

const RequestsTableView = lazy(
  () => import("../../views/requests/RequetsTable"),
);

const RequestsContainer = () => {
  const { params, key, isCustomSort } = useListQuery();
  const { loadMoreRequests, fetchRequests } = useRequests(params);
  const hasMoreObject = useLoadMore<RequestTableRow>({
    paginatedPage: loadMoreRequests,
    live: !isCustomSort,
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <RequestsTableView hasMoreObject={hasMoreObject} />;
};

export default RequestsContainer;
