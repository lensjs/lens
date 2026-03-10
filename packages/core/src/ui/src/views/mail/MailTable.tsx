import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import type { HasMoreType, MailTableRow } from "../../types";
import getColumns from "./columns";

const MailTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<MailTableRow>;
}) => {
  return (
    <div>
      <Table columns={getColumns()} data={hasMoreObject.data} />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default MailTable;
