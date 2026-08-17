import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { FcmEntry, FcmTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

export function FcmStatus({ status }: { status: FcmEntry["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
        status === "success"
          ? "bg-success/10 text-success"
          : "bg-danger/10 text-danger",
      )}
    >
      {status}
    </span>
  );
}

const useColumns = (): TableColumn<FcmTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Method",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-fg">
          {row.data.method}
        </span>
      ),
    },
    {
      name: "Target",
      render: (row) => (
        <span
          className="line-clamp-1 font-mono text-sm text-fg"
          title={row.data.target}
        >
          {row.data.target ?? "—"}
        </span>
      ),
    },
    {
      name: "Notification",
      render: (row) => (
        <span className="line-clamp-1 text-sm text-muted" title={row.data.title}>
          {row.data.title ?? "—"}
        </span>
      ),
    },
    {
      name: "Status",
      render: (row) => <FcmStatus status={row.data.status} />,
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
          to={`${paths.FCM}/${row.id}`}
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
