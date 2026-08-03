import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneJob } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import { humanDifferentDate } from "@lensjs/date";
import JobStatusBadge from "../../components/JobStatusBadge";

export default function JobDetailsView({ data }: { data: OneJob }) {
  const paths = getRoutesPaths(useConfig());
  const job = data.data;
  const happened = humanDifferentDate(job.createdAt);

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
      label: "Job",
      value: <span className="font-mono font-semibold">{job.name}</span>,
      className: "text-fg",
    },
    {
      label: "Queue",
      value: <span className="font-mono">{job.queue}</span>,
      className: "text-fg",
    },
    {
      label: "Status",
      value: <JobStatusBadge status={job.status} />,
      className: "text-fg",
    },
    job.attempts != null
      ? { label: "Attempts", value: String(job.attempts), className: "text-fg" }
      : null,
    job.duration
      ? { label: "Duration", value: job.duration, className: "text-fg" }
      : null,
    {
      label: "Happened",
      value: <span title={happened.exact}>{happened.label}</span>,
      className: "text-fg",
    },
    job.failedReason
      ? { label: "Error", value: job.failedReason, className: "text-danger" }
      : null,
  ].filter((i) => !!i);

  const tabs = [
    {
      id: "data",
      label: "Data",
      shouldShow: job.data !== undefined,
      content: <JsonViewer data={job.data} />,
    },
    {
      id: "result",
      label: "Result",
      shouldShow: job.result !== undefined,
      content: <JsonViewer data={job.result} />,
    },
  ].filter((t) => t.shouldShow);

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />
      {tabs.length > 0 && (
        <TabbedDataViewer tabs={tabs} defaultActiveTab={tabs[0]?.id ?? "data"} />
      )}
    </div>
  );
}
