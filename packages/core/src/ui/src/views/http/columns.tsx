import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { HttpTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";
import MethodBadge from "../../components/MethodBadge";
import StatusCode from "../../components/StatusCode";

const useColumns = (): TableColumn<HttpTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Method",
      render: (row) => <MethodBadge method={row.data.method} />,
    },
    {
      name: "URL",
      render: (row) => (
        <span
          className="line-clamp-1 font-mono text-sm text-fg"
          title={row.data.url}
        >
          {row.data.url}
        </span>
      ),
    },
    {
      name: "Status",
      render: (row) =>
        row.data.status != null ? (
          <StatusCode status={row.data.status} />
        ) : (
          <span className="text-dim">—</span>
        ),
    },
    {
      name: "Duration",
      render: (row) => (
        <span className="font-mono text-sm text-muted">{row.data.duration}</span>
      ),
      position: "end",
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
          to={`${paths.HTTP}/${row.id}`}
          className="text-muted transition-colors hover:text-fg"
        >
          <CircleArrowRightIcon size={20} />
        </Link>
      ),
      position: "end",
    },
  ];
};

export default useColumns;
