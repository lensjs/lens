import { lazy, useEffect } from "react";
import useRequests from "../../hooks/useRequests";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { RequestTableRow } from "../../types";

const RequestsTableView = lazy(
  () => import("../../views/requests/RequetsTable"),
);

const RequestsContainer = () => {
  const { loadMoreRequests, fetchRequests } = useRequests();
  const hasMoreObject = useLoadMore<RequestTableRow>({
    paginatedPage: loadMoreRequests,
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  return <RequestsTableView hasMoreObject={hasMoreObject} />;
};

export default RequestsContainer;
