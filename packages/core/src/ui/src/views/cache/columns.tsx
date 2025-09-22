import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { CacheTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";
import CacheActionBadge from "../../components/CacheActionBadge";

const getColumns = (): TableColumn<CacheTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Key",
      value: (row) => row.data.data?.key ?? "__",
    },
    {
      name: "Operation",
      render: (row) => <CacheActionBadge action={row.data.action} />,
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
          to={`${paths.CACHE_ENTRIES}/${row.id}`}
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
