import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { ExceptionTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";

const getColumns = (): TableColumn<ExceptionTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Type",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {row.data.name || (
              <span className="italic text-gray-400">Unknown</span>
            )}
          </span>
          <span
            className="text-xs text-red-600 dark:text-red-400 truncate max-w-xs"
            title={row.data.message}
          >
            {row.data.message}
          </span>
        </div>
      ),
    },
    {
      name: "Happened",
      render: (row) => {
        const { label, exact } = humanDifferentDate(row.data.createdAt);
        return <span title={exact}>{label}</span>;
      },
      position: "end",
      class: "min-w-32",
    },
    {
      name: "Actions",
      render: (row) => (
        <Link
          to={`${paths.EXCEPTIONS}/${row.id}`}
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
