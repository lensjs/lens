import { useNavigate } from "react-router-dom";
import { LoadMoreButton } from "../../components/LoadMore";
import Table from "../../components/Table";
import ListToolbar from "../../components/ListToolbar";
import { useListView, type FilterDef, type SortDef } from "../../hooks/useListView";
import { toTime } from "../../utils/format";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import type { HasMoreType, CacheTableRow } from "../../types";
import useColumns from "./columns";

const filters: FilterDef<CacheTableRow>[] = [
  {
    key: "action",
    label: "Action",
    get: (r) => String(r.data.action ?? ""),
    options: ["hit", "miss", "write", "delete", "clear"].map((v) => ({
      value: v,
      label: v,
    })),
  },
];

const sorts: SortDef<CacheTableRow>[] = [
  { key: "time", label: "Time", get: (r) => toTime(r.data.createdAt) },
];

const CacheEntriesTable = ({
  hasMoreObject,
}: {
  hasMoreObject: HasMoreType<CacheTableRow>;
}) => {
  const config = useConfig();
  const paths = getRoutesPaths(config);
  const navigate = useNavigate();
  const columns = useColumns();

  const controls = useListView<CacheTableRow>(hasMoreObject.data, {
    search: (r) => [r.data.data?.key, r.data.action],
    filters,
    sorts,
  });

  const stats = [
    { label: "Loaded", value: hasMoreObject.data.length },
    {
      label: "Hits",
      value: controls.rows.filter((r) => r.data.action === "hit").length,
      tone: "success" as const,
    },
  ];

  return (
    <div>
      <ListToolbar
        controls={controls}
        filters={filters}
        sorts={sorts}
        stats={stats}
        searchPlaceholder="Search by key or action…"
        hasGap={hasMoreObject.hasGap}
      />
      <Table
        columns={columns}
        data={controls.rows}
        onRowClick={(row) => navigate(`${paths.CACHE_ENTRIES}/${row.id}`)}
      />
      <LoadMoreButton paginatedPage={hasMoreObject} />
    </div>
  );
};

export default CacheEntriesTable;
