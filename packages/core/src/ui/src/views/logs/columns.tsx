import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { LogTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";
import LogLevelBadge from "../../components/LogLevelBadge";

const useColumns = (): TableColumn<LogTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Level",
      render: (row) => <LogLevelBadge level={row.data.level} />,
    },
    {
      name: "Message",
      render: (row) => (
        <span
          className="line-clamp-1 font-mono text-sm text-fg"
          title={row.data.message}
        >
          {row.data.message}
        </span>
      ),
    },
    {
      name: "Source",
      render: (row) => (
        <span className="font-mono text-xs text-muted">
          {row.data.source ?? "—"}
        </span>
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
          to={`${paths.LOGS}/${row.id}`}
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
