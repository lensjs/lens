import { useMemo } from "react";
import DetailPanel, { type DetailItem } from "../../components/DetailPanel";
import type { OneRequest } from "../../types";
import { formatDateWithTimeAgo } from "@lensjs/date";
import RequestMethodBadge from "../../components/MethodBadge";
import StatusCode from "../../components/StatusCode";

const BasicRequestDetails = ({ request }: { request: OneRequest }) => {
  const formattedTime = useMemo(() => {
    return formatDateWithTimeAgo(request?.request.data?.createdAt);
  }, [request?.request.data.createdAt]);

  if (!request || !request.request) {
    return (
      <DetailPanel
        title="Request Details"
        items={[]}
        emptyMessage="No request data available"
      />
    );
  }

  const getHostname = () => {
    return request?.request.data?.headers?.host || "Unknown";
  };

  const detailItems = useMemo(
    (): DetailItem[] => [
      {
        label: "Time",
        value: formattedTime,
        className: "text-gray-900 dark:text-gray-100",
      },
      {
        label: "Hostname",
        value: getHostname(),
        className: "text-gray-900 dark:text-gray-100 font-mono",
      },
      {
        label: "Method",
        value: request.request.data.method ? (
          <RequestMethodBadge method={request.request.data.method} />
        ) : (
          "Unknown"
        ),
      },
      {
        label: "Request ID",
        value: request.request.data.id || "N/A",
        className: "text-gray-700 dark:text-gray-300 font-mono text-sm",
      },
      {
        label: "Path",
        value: request.request.data.path || "N/A",
        className: "text-gray-900 dark:text-gray-100 font-mono",
      },
      {
        label: "Status",
        value: request.request.data.status ? (
          <StatusCode status={request.request.data.status} />
        ) : (
          "N/A"
        ),
      },
      {
        label: "Duration",
        value: request.request.data.duration || "N/A",
        className: "text-gray-900 dark:text-gray-100 font-medium",
      },
      {
        label: "IP Address",
        value: request.request.data.ip || "N/A",
        className: "text-gray-900 dark:text-gray-100 font-mono",
      },
    ],
    [request.request.data, formattedTime],
  );

  return <DetailPanel title="Request Details" items={detailItems} />;
};

export default BasicRequestDetails;
