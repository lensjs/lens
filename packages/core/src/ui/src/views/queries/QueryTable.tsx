import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import { useListView, type SortDef } from "../../hooks/useListView";
import { durationToMs, toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, QueryTableRow } from "../../types";
import useColumns from "./columns";

const sorts: SortDef<QueryTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
  {
    key: "duration",
    label: "Duration",
    get: (r) => durationToMs(r.data.duration),
    numeric: true,
  },
];

const QueryTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<QueryTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const providerOptions = Array.from(
    new Set(hasMoreObject.data.map((r) => r.data.type).filter(Boolean)),
  ).map((v) => ({ value: String(v), label: String(v) }));

  const filters = [
    {
      key: "provider",
      label: "Provider",
      get: (r: QueryTableRow) => String(r.data.type ?? ""),
      options: providerOptions,
    },
  ];

  const controls = useListView<QueryTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.query, r.data.type],
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
        searchPlaceholder="Search queries…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.QUERIES}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default QueryTable;
