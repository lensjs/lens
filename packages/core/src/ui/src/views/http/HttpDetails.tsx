import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneHttp } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import MethodBadge from "../../components/MethodBadge";
import StatusCode from "../../components/StatusCode";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";

export default function HttpDetailsView({ data }: { data: OneHttp }) {
  const http = data.data;

  const details = [
    data.lens_entry_id
      ? {
          label: "Request",
          value: (
            <Link
              to={`${getRoutesPaths(useConfig()).REQUESTS}/${data.lens_entry_id}`}
              className="text-accent hover:text-accent-hover hover:underline font-semibold"
            >
              View Request
            </Link>
          ),
          className: "text-fg",
        }
      : null,
    {
      label: "Method",
      value: <MethodBadge method={http.method} />,
      className: "text-fg",
    },
    http.status != null
      ? {
          label: "Status",
          value: <StatusCode status={http.status} />,
          className: "text-fg",
        }
      : null,
    {
      label: "URL",
      value: <span className="break-all font-mono">{http.url}</span>,
      className: "text-fg",
    },
    {
      label: "Duration",
      value: http.duration,
      className: "text-fg",
    },
    http.error
      ? { label: "Error", value: http.error, className: "text-danger" }
      : null,
  ].filter((i) => !!i);

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />
      <TabbedDataViewer
        tabs={[
          {
            id: "reqHeaders",
            label: "Request Headers",
            shouldShow: !!http.requestHeaders,
            content: <JsonViewer data={http.requestHeaders} />,
          },
          {
            id: "resHeaders",
            label: "Response Headers",
            shouldShow: !!http.responseHeaders,
            content: <JsonViewer data={http.responseHeaders} />,
          },
          {
            id: "reqBody",
            label: "Request Body",
            shouldShow: !!http.requestBody,
            content: <JsonViewer data={http.requestBody} />,
          },
          {
            id: "resBody",
            label: "Response Body",
            shouldShow: !!http.responseBody,
            content: <JsonViewer data={http.responseBody} />,
          },
        ]}
        defaultActiveTab="reqHeaders"
      />
    </div>
  );
}
