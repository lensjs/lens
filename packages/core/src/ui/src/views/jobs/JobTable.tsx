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
import type { HasMoreType, JobTableRow } from "../../types";
import useColumns from "./columns";

const filters: FilterDef<JobTableRow>[] = [
  {
    key: "status",
    label: "Status",
    get: (r) => String(r.data.status ?? ""),
    options: ["active", "completed", "failed"].map((v) => ({
      value: v,
      label: v,
    })),
  },
];

const sorts: SortDef<JobTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
  {
    key: "duration",
    label: "Duration",
    get: (r) => durationToMs(r.data.duration),
    numeric: true,
  },
];

const JobTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<JobTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<JobTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.name, r.data.queue],
    filters,
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <PageHeader
        title="Jobs & Queues"
        description="Track background jobs and their lifecycle."
      />
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by job name or queue…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) =>
          navigate(`${paths.JOBS}/${encodeURIComponent(row.id)}`)
        }
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default JobTable;
