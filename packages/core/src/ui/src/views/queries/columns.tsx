import { CircleArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { TableColumn } from "../../components/Table";
import { getRoutesPaths } from "../../router/routes";
import type { QueryTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import {
  highlightMongo,
  highlightSql,
} from "../../components/common/highlights/SqlHighlights";
import { durationToMs } from "../../utils/format";
import { SLOW_QUERY_MS } from "../../utils/queryFlags";
import QueryFlagBadge from "../../components/QueryFlagBadge";

function highlightQuery(query: string, type?: string) {
  return type === "mongodb" ? highlightMongo(query) : highlightSql(query);
}

const useColumns = (): TableColumn<QueryTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Query",
      render: (row) => (
        <div className="flex max-w-xl items-center gap-2">
          <code
            className="text-sm font-mono text-fg leading-relaxed line-clamp-1"
            title={row.data.query}
          >
            {highlightQuery(row.data.query, row.data.type)}
          </code>
          {durationToMs(row.data.duration) >= SLOW_QUERY_MS && (
            <QueryFlagBadge flag="slow" />
          )}
        </div>
      ),
    },
    {
      name: "Duration",
      render: (row) => (
        <div className="col-span-1 text-right">
            <span className="text-sm text-muted font-mono">
            {row.data.duration}
          </span>
        </div>
      ),
    },
    {
      name: "Provider",
      render: (row) => {
        return (
          <div className="col-span-2 text-right">
            <span className="text-sm text-muted font-mono">
              {row.data.type}
            </span>
          </div>
        );
      },
    },
    {
      name: "Happened",
      render: (row) => {
        const { label, exact } = humanDifferentDate(row.data.createdAt);
        return (
          <span className="text-nowrap" title={exact}>
            {label}
          </span>
        );
      },
      position: "end",
      class: "min-w-32",
    },
    {
      name: "Actions",
      render: (row) => (
        <Link
          to={`${paths.QUERIES}/${row.id}`}
          className="text-muted transition-colors hover:text-accent"
        >
          <CircleArrowRightIcon size={20} />
        </Link>
      ),
      position: "end",
    },
  ];
};

export default useColumns;
