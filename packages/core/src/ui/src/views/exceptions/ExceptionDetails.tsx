import { Link } from "react-router-dom";
import type { OneException } from "../../types";
import { getRoutesPaths } from "../../router/routes";
import { useConfig } from "../../utils/context";
import DetailPanel from "../../components/DetailPanel";
import TabbedDataViewer, {
  type TabItem,
} from "../../components/tabs/TabbedDataViewer";
import CodeFrameViewer from "../../components/CodeFrameViewer";
import StackTraceViewer from "../../components/StackTraceViewer/StackTraceViewer";

const ExceptionDetails = ({ data }: { data: OneException }) => {
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
    data.data.name
      ? {
          label: "Name",
          value: data.data.name,
          className: "text-gray-900 dark:text-gray-100",
        }
      : null,
    data.data.fileInfo?.file
      ? {
          label: "File",
          value: data.data.fileInfo?.file,
          className: "text-gray-900 dark:text-gray-100",
        }
      : null,
    data.data.fileInfo?.function
      ? {
          label: "Function",
          value: data.data.fileInfo?.function,
          className: "text-gray-900 dark:text-gray-100",
        }
      : null,
  ].filter((i) => !!i);

  const tabs: TabItem[] = [
    {
      id: "message",
      label: "Message",
      data: data.data.message,
      shouldShow: !!data.data.message,
    },
    {
      id: "stack-trace",
      label: "Stacktrace",
      content: <StackTraceViewer trace={data.data.trace || []} />,
      shouldShow: !!data.data.trace && data.data.trace.length > 0,
    },
    {
      id: "location",
      label: "Location",
      content: <CodeFrameViewer codeFrame={data.data.codeFrame} />,
      shouldShow: !!data.data.codeFrame,
    },
    {
      id: "cause",
      label: "Cause",
      data: data.data.cause ?? "",
      shouldShow: !!data.data.cause && data.data.cause.length > 0,
    },
    {
      id: "original-stack",
      label: "Original Stack",
      data: data.data.originalStack ?? "",
      shouldShow:
        !!data.data.originalStack && data.data.originalStack.length > 0,
    },
  ];
  return (
    <div className="flex flex-col gap-4">
      <DetailPanel title="Exception Details" items={details} />
      <TabbedDataViewer tabs={tabs} />
    </div>
  );
};

export default ExceptionDetails;
