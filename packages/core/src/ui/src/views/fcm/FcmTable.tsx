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
import type { HasMoreType, FcmTableRow } from "../../types";
import useColumns from "./columns";

const filters: FilterDef<FcmTableRow>[] = [
  {
    key: "status",
    label: "Status",
    get: (r) => String(r.data.status ?? ""),
    options: ["success", "failed"].map((v) => ({ value: v, label: v })),
  },
];

const sorts: SortDef<FcmTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
  {
    key: "duration",
    label: "Duration",
    get: (r) => durationToMs(r.data.duration),
    numeric: true,
  },
];

const FcmTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<FcmTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<FcmTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.method, r.data.target, r.data.title, r.data.body],
    filters,
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <PageHeader
        title="Push (FCM)"
        description="Inspect push notifications and delivery status."
      />
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by method, target or title…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.FCM}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default FcmTable;
