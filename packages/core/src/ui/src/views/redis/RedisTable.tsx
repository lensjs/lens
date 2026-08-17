import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import PageHeader from "../../components/PageHeader";
import {
  useListView,
  type FilterDef,
  type SortDef,
} from "../../hooks/useListView";
import { durationToMs, toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, RedisTableRow } from "../../types";
import useColumns, { redisStatement } from "./columns";

const filters: FilterDef<RedisTableRow>[] = [
  {
    key: "status",
    label: "Status",
    get: (r) => String(r.data.status ?? ""),
    options: ["success", "failed"].map((v) => ({ value: v, label: v })),
  },
];

const sorts: SortDef<RedisTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
  {
    key: "duration",
    label: "Duration",
    get: (r) => durationToMs(r.data.duration),
    numeric: true,
  },
];

const RedisTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<RedisTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<RedisTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.command, redisStatement(r.data)],
    filters,
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <PageHeader
        title="Redis"
        description="Inspect Redis commands and responses."
      />
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by command or args…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.REDIS}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default RedisTable;
