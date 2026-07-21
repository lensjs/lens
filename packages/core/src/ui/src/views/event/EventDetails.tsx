import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneEvent } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";
import { humanDifferentDate } from "@lensjs/date";

export default function EventDetailsView({ data }: { data: OneEvent }) {
  const paths = getRoutesPaths(useConfig());
  const event = data.data;
  const happened = humanDifferentDate(event.createdAt);

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
      label: "Event",
      value: <span className="font-mono font-semibold">{event.name}</span>,
      className: "text-fg",
    },
    {
      label: "Happened",
      value: <span title={happened.exact}>{happened.label}</span>,
      className: "text-fg",
    },
  ].filter((i) => !!i);

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />
      {event.payload !== undefined && (
        <TabbedDataViewer
          tabs={[
            {
              id: "payload",
              label: "Payload",
              shouldShow: true,
              content: <JsonViewer data={event.payload} />,
            },
          ]}
          defaultActiveTab="payload"
        />
      )}
    </div>
  );
}
