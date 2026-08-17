import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneRedis } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import { humanDifferentDate } from "@lensjs/date";
import { RedisStatus, redisStatement } from "./columns";

export default function RedisDetailsView({ data }: { data: OneRedis }) {
  const paths = getRoutesPaths(useConfig());
  const redis = data.data;
  const happened = humanDifferentDate(redis.createdAt);

  const details = [
    data.lens_entry_id
      ? {
          label: "Request",
          value: (
            <Link
              to={`${paths.REQUESTS}/${data.lens_entry_id}`}
              className="text-fg hover:underline font-semibold"
            >
              View Request
            </Link>
          ),
          className: "text-fg",
        }
      : null,
    {
      label: "Command",
      value: <span className="font-mono font-semibold">{redis.command}</span>,
      className: "text-fg",
    },
    {
      label: "Status",
      value: <RedisStatus status={redis.status} />,
      className: "text-fg",
    },
    {
      label: "Duration",
      value: redis.duration,
      className: "text-fg",
    },
    {
      label: "Happened",
      value: <span title={happened.exact}>{happened.label}</span>,
      className: "text-fg",
    },
    redis.error
      ? { label: "Error", value: redis.error, className: "text-danger" }
      : null,
  ].filter((i) => !!i);

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />
      <TabbedDataViewer
        tabs={[
          {
            id: "statement",
            label: "Statement",
            shouldShow: true,
            content: (
              <pre className="overflow-x-auto rounded-lg border border-border bg-canvas p-4 font-mono text-sm text-fg">
                {redisStatement(redis)}
              </pre>
            ),
          },
          {
            id: "args",
            label: "Arguments",
            shouldShow: (redis.args?.length ?? 0) > 0,
            content: <JsonViewer data={redis.args ?? []} />,
          },
        ]}
        defaultActiveTab="statement"
      />
    </div>
  );
}
