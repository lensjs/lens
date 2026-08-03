import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import {
  useListView,
  type FilterDef,
  type SortDef,
} from "../../hooks/useListView";
import { durationToMs, toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, HttpTableRow } from "../../types";
import useColumns from "./columns";

const filters: FilterDef<HttpTableRow>[] = [
  {
    key: "method",
    label: "Method",
    get: (r) => String(r.data.method ?? ""),
    options: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((v) => ({
      value: v,
      label: v,
    })),
  },
];

const sorts: SortDef<HttpTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
  {
    key: "duration",
    label: "Duration",
    get: (r) => durationToMs(r.data.duration),
    numeric: true,
  },
];

const HttpTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<HttpTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<HttpTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.url, r.data.method, String(r.data.status ?? "")],
    filters,
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by URL, method or status…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.HTTP}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default HttpTable;
