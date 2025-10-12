import { lazy, useEffect,  } from "react";
import useRequests from "../../hooks/useRequests";
import { useLoadMore } from "../../hooks/useLoadMore";
import type { RequestTableRow } from "../../types";
import SearchInput from "../../components/SearchInput";

const RequestsTableView = lazy(
  () => import("../../views/requests/RequetsTable"),
);
const RequestsContainer = () => {
  const { loadMoreRequests, fetchRequests,search,setSearch,filterRequests } = useRequests();
  let hasMoreObject = useLoadMore<RequestTableRow>({
    paginatedPage: loadMoreRequests,
  });
   hasMoreObject = {
     ...hasMoreObject,
     data:hasMoreObject.data.filter(filterRequests)
   }
  useEffect(() => {
    fetchRequests();
  }, []);

  return <div>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by method, path, or status..."
        resultCount={hasMoreObject.data.length}
        showResultCount={true}
      /><RequestsTableView hasMoreObject={hasMoreObject} />
      </div>
};

export default RequestsContainer;
