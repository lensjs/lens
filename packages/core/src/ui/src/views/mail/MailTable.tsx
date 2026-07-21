import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import { useListView, type SortDef } from "../../hooks/useListView";
import { toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, MailTableRow } from "../../types";
import useColumns from "./columns";

const sorts: SortDef<MailTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.created_at) },
];

const MailTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<MailTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<MailTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.subject],
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <ListToolbar
        controls={controls}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by subject…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.MAIL}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default MailTable;
