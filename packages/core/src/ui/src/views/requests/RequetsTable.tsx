import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import type { HasMoreType, RequestTableRow } from "../../types";
import getColumns from "./columns";

const RequestTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<RequestTableRow>;
}) => {
  return (
    <div>
      <Table columns={getColumns()} data={hasMoreObject.data} />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default RequestTable;
