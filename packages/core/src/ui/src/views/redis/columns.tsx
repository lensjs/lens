import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { RedisEntry, RedisTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

export function redisStatement(entry: RedisEntry): string {
  const args = (entry.args ?? []).join(" ");
  return args ? `${entry.command} ${args}` : entry.command;
}

export function RedisStatus({ status }: { status: RedisEntry["status"] }) {
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

const useColumns = (): TableColumn<RedisTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Command",
      render: (row) => (
        <span
          className="line-clamp-1 font-mono text-sm text-fg"
          title={redisStatement(row.data)}
        >
          <span className="font-semibold text-accent">{row.data.command}</span>{" "}
          <span className="text-muted">{(row.data.args ?? []).join(" ")}</span>
        </span>
      ),
    },
    {
      name: "Status",
      render: (row) => <RedisStatus status={row.data.status} />,
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
          to={`${paths.REDIS}/${row.id}`}
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
