import { CircleArrowRightIcon } from "lucide-react";
import type { JSX } from "react";
import { Link } from "react-router-dom";
import type { TableColumn } from "../../components/Table";
import { getRoutesPaths } from "../../router/routes";
import type { QueryTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";

function highlightSQL(query: string): JSX.Element {
  return (
    <span className="text-red-600 dark:text-red-400 font-mono">{query}</span>
  );
}

const getColumns = (): TableColumn<QueryTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Query",
      render: (row) => (
        <div className="max-w-xl">
          <code
            className="text-sm font-mono text-slate-800 dark:text-slate-300 leading-relaxed line-clamp-1"
            title={row.data.query}
          >
            {highlightSQL(row.data.query)}
          </code>
        </div>
      ),
    },
    {
      name: "Duration",
      render: (row) => (
        <div className="col-span-1 text-right">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
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
            <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
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
          className="transition-colors duration-100 hover:text-white"
        >
          <CircleArrowRightIcon size={20} />
        </Link>
      ),
      position: "end",
    },
  ];
};

export default getColumns;
