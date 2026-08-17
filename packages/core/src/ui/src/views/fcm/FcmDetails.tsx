import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneFcm } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import { humanDifferentDate } from "@lensjs/date";
import { FcmStatus } from "./columns";

export default function FcmDetailsView({ data }: { data: OneFcm }) {
  const paths = getRoutesPaths(useConfig());
  const fcm = data.data;
  const happened = humanDifferentDate(fcm.createdAt);

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
      label: "Method",
      value: <span className="font-mono font-semibold">{fcm.method}</span>,
      className: "text-fg",
    },
    {
      label: "Status",
      value: <FcmStatus status={fcm.status} />,
      className: "text-fg",
    },
    fcm.target
      ? {
          label: "Target",
          value: <span className="break-all font-mono">{fcm.target}</span>,
          className: "text-fg",
        }
      : null,
    fcm.title
      ? { label: "Title", value: fcm.title, className: "text-fg" }
      : null,
    fcm.body ? { label: "Body", value: fcm.body, className: "text-fg" } : null,
    fcm.messageId
      ? {
          label: "Message ID",
          value: <span className="break-all font-mono">{fcm.messageId}</span>,
          className: "text-fg",
        }
      : null,
    fcm.successCount != null
      ? {
          label: "Success / Failure",
          value: `${fcm.successCount} / ${fcm.failureCount ?? 0}`,
          className: "text-fg",
        }
      : null,
    {
      label: "Duration",
      value: fcm.duration,
      className: "text-fg",
    },
    {
      label: "Happened",
      value: <span title={happened.exact}>{happened.label}</span>,
      className: "text-fg",
    },
    fcm.error
      ? { label: "Error", value: fcm.error, className: "text-danger" }
      : null,
  ].filter((i) => !!i);

  const recipients = fcm.recipients ?? [];
  const succeeded = recipients.filter((r) => r.success).length;
  const failed = recipients.length - succeeded;

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />

      {recipients.length > 0 && (
        <div className="card-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-surface-2/40 px-5 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Recipients ({recipients.length})
            </h2>
            <span className="text-xs text-muted">
              <span className="text-success">{succeeded} succeeded</span>
              {" · "}
              <span className={failed ? "text-danger" : ""}>
                {failed} failed
              </span>
            </span>
          </div>
          <div className="divide-y divide-border">
            {recipients.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-5 py-2.5"
              >
                <span
                  className="min-w-0 flex-1 truncate font-mono text-sm text-fg"
                  title={r.target}
                >
                  {r.target}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  {r.messageId && (
                    <span
                      className="hidden max-w-[220px] truncate font-mono text-xs text-muted sm:inline"
                      title={r.messageId}
                    >
                      {r.messageId}
                    </span>
                  )}
                  {r.error && (
                    <span
                      className="max-w-[260px] truncate text-xs text-danger"
                      title={r.error}
                    >
                      {r.error}
                    </span>
                  )}
                  <FcmStatus status={r.success ? "success" : "failed"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fcm.data && Object.keys(fcm.data).length > 0 && (
        <TabbedDataViewer
          tabs={[
            {
              id: "data",
              label: "Data Payload",
              shouldShow: true,
              content: <JsonViewer data={fcm.data} />,
            },
          ]}
          defaultActiveTab="data"
        />
      )}
    </div>
  );
}
