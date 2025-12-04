import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import type { OneQuery } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import { formatDateWithTimeAgo } from "@lensjs/date";
import QueryViewer from "../../components/queryFormatters/QueryViewer";

export default function QueryDetails({ query }: { query: OneQuery }) {
  const detailItems = [
    query.lens_entry_id && {
      label: "Request",
      value: (
        <Link
          to={`${getRoutesPaths(useConfig()).REQUESTS}/${query.lens_entry_id}`}
          className="text-blue-600 hover:underline font-semibold"
        >
          View Request
        </Link>
      ),
      className: "text-gray-900 dark:text-gray-100",
    },
    {
      label: "Time",
      value: <span>{formatDateWithTimeAgo(query.data.createdAt)}</span>,
      className: "text-gray-900 dark:text-gray-100",
    },
    {
      label: "Duration",
      value: <span>{query.data.duration}</span>,
      className: "text-gray-900 dark:text-gray-100",
    },
    {
      label: "Provider",
      value: <span>{query.data.type}</span>,
      className: "text-gray-900 dark:text-gray-100",
    },
  ].filter((item) => !!item);

  return (
    <div className="flex flex-col gap-4">
      {" "}
      <DetailPanel title="Query Details" items={detailItems} />
      <TabbedDataViewer
        tabs={[
          {
            id: "query",
            data: ["query"],
            label: "Query",
            content: <QueryViewer queryPayload={query.data} />,
          },
        ]}
        defaultActiveTab="query"
      />
    </div>
  );
}
