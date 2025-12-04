import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import type { ExceptionTableRow, HasMoreType } from "../../types";
import getColumns from "./columns";

const CacheEntriesTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<ExceptionTableRow>;
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

export default CacheEntriesTable;
