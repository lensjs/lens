import { Link } from "react-router-dom";
import DetailPanel from "../../components/DetailPanel";
import type { OneCache } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import CacheActionBadge from "../../components/CacheActionBadge";
import JsonViewer from "../../components/JsonViewer";
import TabbedDataViewer from "../../components/tabs/TabbedDataViewer";

export default function CacheEntryView({ data }: { data: OneCache }) {
  const details = [
    data.lens_entry_id
      ? {
          label: "Request",
          value: (
            <Link
              to={`${getRoutesPaths(useConfig()).REQUESTS}/${data.lens_entry_id}`}
              className="text-blue-600 hover:underline font-semibold"
            >
              View Request
            </Link>
          ),
          className: "text-gray-900 dark:text-gray-100",
        }
      : null,
    {
      label: "Operation",
      value: <CacheActionBadge action={data.data.action} />,
      className: "text-gray-900 dark:text-gray-100",
    },
    data.data.data.key
      ? {
          label: "Key",
          value: data.data.data.key ?? "__",
          className: "text-gray-900 dark:text-gray-100",
        }
      : null,
  ].filter((i) => !!i);

  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Details" items={details} />
      <TabbedDataViewer
        tabs={[
          {
            id: "value",
            label: "Value",
            shouldShow: !!data.data.data.value,
            content: <JsonViewer data={data.data.data.value} />,
          },
        ]}
        defaultActiveTab="value"
      />
    </div>
  );
}
