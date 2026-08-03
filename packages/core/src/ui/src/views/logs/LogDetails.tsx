import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneLog } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import { humanDifferentDate } from "@lensjs/date";
import LogLevelBadge from "../../components/LogLevelBadge";

export default function LogDetailsView({ data }: { data: OneLog }) {
  const paths = getRoutesPaths(useConfig());
  const log = data.data;
  const happened = humanDifferentDate(log.createdAt);

  const details = [
    data.lens_entry_id
      ? {
          label: "Request",
          value: (
            <Link
              to={`${paths.REQUESTS}/${data.lens_entry_id}`}
              className="text-accent hover:text-accent-hover hover:underline font-semibold"
            >
              View Request
            </Link>
          ),
          className: "text-fg",
        }
      : null,
    {
      label: "Level",
      value: <LogLevelBadge level={log.level} />,
      className: "text-fg",
    },
    log.source
      ? {
          label: "Source",
          value: <span className="font-mono">{log.source}</span>,
          className: "text-fg",
        }
      : null,
    {
      label: "Happened",
      value: <span title={happened.exact}>{happened.label}</span>,
      className: "text-fg",
    },
  ].filter((i) => !!i);

  const hasContext = !!log.context && Object.keys(log.context).length > 0;

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />

      <div className="card-panel overflow-hidden">
        <div className="border-b border-border bg-surface-2/40 px-5 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Message
          </h2>
        </div>
        <pre className="whitespace-pre-wrap break-words p-5 font-mono text-sm text-fg">
          {log.message}
        </pre>
      </div>

      {hasContext && (
        <TabbedDataViewer
          tabs={[
            {
              id: "context",
              label: "Context",
              shouldShow: true,
              content: <JsonViewer data={log.context} />,
            },
          ]}
          defaultActiveTab="context"
        />
      )}
    </div>
  );
}
