import { CircleArrowRightIcon } from "lucide-react";
import { getRoutesPaths } from "../../router/routes";
import type { MailTableRow } from "../../types";
import { useConfig } from "../../utils/context";
import { humanDifferentDate } from "@lensjs/date";
import type { TableColumn } from "../../components/Table";
import { Link } from "react-router-dom";

const decodeRFC2047 = (text: string): string => {
  return text.replace(/=\?([^?]+)\?([QB])\?([^?]+)\?=/gi, (_, charset, encoding, data) => {
    if (encoding.toUpperCase() === "B") {
      try {
        const bin = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        return new TextDecoder(charset).decode(bin);
      } catch (e) {
        return data;
      }
    } else {
      const decoded = data
        .replace(/_/g, " ")
        .replace(/=([0-9A-F]{2})/gi, (__: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        );
      try {
        return new TextDecoder(charset).decode(
          Uint8Array.from([...decoded].map((c) => c.charCodeAt(0))),
        );
      } catch (e) {
        return decoded;
      }
    }
  });
};

const getColumns = (): TableColumn<MailTableRow>[] => {
  const paths = getRoutesPaths(useConfig());

  return [
    {
      name: "Subject",
      render: (row) => (
        <Link
          to={`${paths.MAIL}/${row.id}`}
          className="line-clamp-2 max-w-lg min-w-40 text-base text-blue-600 dark:text-neutral-200 hover:underline font-medium"
        >
          {row.data.subject ? decodeRFC2047(row.data.subject) : "(No Subject)"}
        </Link>
      ),
    },
    {
      name: "Recipients",
      value: (row) => {
        return row.data.recipientsCount?.toString() || "0";
      },
    },
    {
      name: "Happened",
      render: (row) => {
        const { label, exact } = humanDifferentDate(row.created_at);
        return <span title={exact}>{label}</span>;
      },
      position: "end",
      class: "min-w-32",
    },
    {
      name: "Actions",
      render: (row) => (
        <Link
          to={`${paths.MAIL}/${row.id}`}
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
