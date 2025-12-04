import { CircleArrowRightIcon } from "lucide-react";
import RequestMethodBadge from "../../components/MethodBadge";
import StatusCode from "../../components/StatusCode";
import { getRoutesPaths } from "../../router/routes";
import type { RequestTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";

const getColumns = (): TableColumn<RequestTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Method",
      render: (row) => <RequestMethodBadge method={row.data.method} />,
    },
    {
      name: "Path",
      render: (row) => (
        <Link
          to={`${paths.REQUESTS}/${row.id}`}
          className="line-clamp-2 max-w-80 min-w-40 text-base text-blue-600 dark:text-neutral-200 hover:underline"
        >
          {row.data.path}
        </Link>
      ),
    },
    {
      name: "Status",
      render: (row) => <StatusCode status={row.data.status} />,
    },
    {
      name: "Duration",
      value: (row) => row.data.duration,
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
          to={`${paths.REQUESTS}/${row.id}`}
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
