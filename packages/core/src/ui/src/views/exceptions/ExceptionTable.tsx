import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import GroupToggle from "../../components/GroupToggle";
import { useListView, type SortDef } from "../../hooks/useListView";
import { toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, ExceptionTableRow } from "../../types";
import useColumns from "./columns";

const sorts: SortDef<ExceptionTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
];

const ExceptionTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<ExceptionTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<ExceptionTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.name, r.data.message],
    sorts,
    // A grouped-issue drill-down scopes the flat list by fingerprint; make it a
    // clearable, counted filter so the Clear button surfaces and resets it.
    extraParams: ["fingerprint"],
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <ListToolbar
        controls={controls}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by type or message…"
        hasGap={hasMoreObject.hasGap}
        actions={<GroupToggle />}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.EXCEPTIONS}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default ExceptionTable;
