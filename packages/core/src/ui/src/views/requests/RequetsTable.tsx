import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import PageHeader from "../../components/PageHeader";
import { useListView, type FilterDef, type SortDef } from "../../hooks/useListView";
import { durationToMs, statusClass, toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, RequestTableRow } from "../../types";
import useColumns from "./columns";

const filters: FilterDef<RequestTableRow>[] = [
  {
    key: "method",
    label: "Method",
    get: (r) => String(r.data.method ?? ""),
    options: ["GET", "POST", "PUT", "PATCH", "DELETE"].map((v) => ({
      value: v,
      label: v,
    })),
  },
  {
    key: "status",
    label: "Status",
    get: (r) => statusClass(r.data.status),
    options: ["2xx", "3xx", "4xx", "5xx"].map((v) => ({ value: v, label: v })),
    // Status buckets map to a numeric range on the server.
    paramKeys: ["status__gte", "status__lt"],
    toParams: (value): Record<string, string> => {
      const lows: Record<string, number> = {
        "2xx": 200,
        "3xx": 300,
        "4xx": 400,
        "5xx": 500,
      };
      const low = lows[value];
      if (low === undefined) return {};
      return { status__gte: String(low), status__lt: String(low + 100) };
    },
    fromParams: (params) => {
      const buckets: Record<string, string> = {
        "200": "2xx",
        "300": "3xx",
        "400": "4xx",
        "500": "5xx",
      };
      return buckets[params.get("status__gte") ?? ""] ?? "";
    },
  },
];

const sorts: SortDef<RequestTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
  {
    key: "duration",
    label: "Duration",
    get: (r) => durationToMs(r.data.duration),
    numeric: true,
  },
];

const RequestTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<RequestTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<RequestTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.method, r.data.path, r.data.status],
    filters,
    sorts,
  });

  const stats = [
    { label: "Loaded", value: hasMoreObject.data.length },
    {
      label: "2xx",
      value: controls.rows.filter((r) => statusClass(r.data.status) === "2xx")
        .length,
      tone: "success" as const,
    },
    {
      label: "4xx",
      value: controls.rows.filter((r) => statusClass(r.data.status) === "4xx")
        .length,
      tone: "warning" as const,
    },
    {
      label: "5xx",
      value: controls.rows.filter((r) => statusClass(r.data.status) === "5xx")
        .length,
      tone: "danger" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Requests"
        description="Inspect incoming HTTP requests and response performance."
      />
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by method, path, or status…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.REQUESTS}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default RequestTable;
