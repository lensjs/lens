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
import type { HasMoreType, EventTableRow } from "../../types";
import useColumns, { payloadPreview } from "./columns";

const filters: FilterDef<EventTableRow>[] = [];

const sorts: SortDef<EventTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
];

const EventTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<EventTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<EventTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.name, payloadPreview(r.data.payload)],
    filters,
    sorts,
  });

  const stats = [{ label: "Loaded", value: hasMoreObject.data.length }];

  return (
    <div>
      <PageHeader
        title="Events"
        description="Inspect dispatched application events and payloads."
      />
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by event name or payload…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.EVENTS}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default EventTable;
