import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { JobTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";
import JobStatusBadge from "../../components/JobStatusBadge";

const useColumns = (): TableColumn<JobTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Job",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-fg">
          {row.data.name}
        </span>
      ),
    },
    {
      name: "Queue",
      render: (row) => (
        <span className="font-mono text-xs text-muted">{row.data.queue}</span>
      ),
    },
    {
      name: "Status",
      render: (row) => <JobStatusBadge status={row.data.status} />,
    },
    {
      name: "Attempts",
      render: (row) => (
        <span className="text-sm text-muted">{row.data.attempts ?? "—"}</span>
      ),
      position: "end",
    },
    {
      name: "Duration",
      render: (row) => (
        <span className="font-mono text-sm text-muted">
          {row.data.duration ?? "—"}
        </span>
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
          to={`${paths.JOBS}/${encodeURIComponent(row.id)}`}
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
