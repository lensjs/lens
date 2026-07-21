import { useMemo, type ReactNode } from "react";
import type { OneRequest } from "../../types";
import { formatDateWithTimeAgo } from "@lensjs/date";
import RequestMethodBadge from "../../components/MethodBadge";
import StatusCode from "../../components/StatusCode";
import { CopyableText } from "../../components/CopyButton";

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-dim">
        {label}
      </span>
      <span className="truncate text-sm text-fg">{children}</span>
    </div>
  );
}

const BasicRequestDetails = ({ request }: { request: OneRequest }) => {
  const data = request?.request?.data;

  const formattedTime = useMemo(
    () => formatDateWithTimeAgo(data?.createdAt),
    [data?.createdAt],
  );

  if (!request || !request.request) {
    return (
      <div className="card-panel p-5 text-sm text-dim">
        No request data available
      </div>
    );
  }

  const host = data?.headers?.host || "Unknown";
  const user = data?.user;

  return (
    <div className="card-panel flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        {data.method && <RequestMethodBadge method={data.method} />}
        {typeof data.status === "number" && <StatusCode status={data.status} />}
        <div className="min-w-0 flex-1">
          <CopyableText
            value={data.path || ""}
            className="font-mono text-sm text-fg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <Meta label="Duration">{data.duration || "N/A"}</Meta>
        <Meta label="Time">{formattedTime}</Meta>
        <Meta label="IP Address">
          <span className="font-mono">{data.ip || "N/A"}</span>
        </Meta>
        <Meta label="Hostname">
          <span className="font-mono">{host}</span>
        </Meta>
        <Meta label="Request ID">
          <CopyableText value={data.id || "N/A"} className="font-mono" />
        </Meta>
        {user && (
          <Meta label="User">
            {user.email || user.name || String(user.id)}
          </Meta>
        )}
      </div>
    </div>
  );
};

export default BasicRequestDetails;
