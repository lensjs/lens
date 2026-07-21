import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { ExceptionTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";

const useColumns = (): TableColumn<ExceptionTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Type",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm text-fg">
            {row.data.name || <span className="italic text-dim">Unknown</span>}
          </span>
          <span
            className="text-xs text-danger truncate max-w-xs"
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
