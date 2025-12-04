import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import type { HasMoreType, QueryTableRow } from "../../types";
import getColumns from "./columns";

const QueriesTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<QueryTableRow>;
}) => {
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table columns={getColumns()} data={hasMoreObject.data} />
      </div>
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default QueriesTable;
