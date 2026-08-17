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
import { toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, LogLevel, LogTableRow } from "../../types";
import useColumns from "./columns";

const LEVELS: LogLevel[] = [
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
];

const filters: FilterDef<LogTableRow>[] = [
  {
    key: "level",
    label: "Level",
    get: (r) => String(r.data.level ?? ""),
    options: LEVELS.map((v) => ({ value: v, label: v })),
  },
];

const sorts: SortDef<LogTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
];

const LogTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<LogTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<LogTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.message, r.data.source],
    filters,
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <PageHeader
        title="Logs"
        description="Browse application logs correlated to requests."
      />
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by message or source…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.LOGS}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default LogTable;
