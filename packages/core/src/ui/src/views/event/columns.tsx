import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { EventTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";

export function payloadPreview(payload: unknown): string {
  if (payload === undefined || payload === null) return "—";
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

const useColumns = (): TableColumn<EventTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Event",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-fg">
          {row.data.name}
        </span>
      ),
    },
    {
      name: "Payload",
      render: (row) => (
        <span
          className="line-clamp-1 font-mono text-sm text-muted"
          title={payloadPreview(row.data.payload)}
        >
          {payloadPreview(row.data.payload)}
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
          to={`${paths.EVENTS}/${row.id}`}
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
