import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { humanDifferentDate } from "@lensjs/date";
import { cn } from "../../utils/cn";
import { useConfig } from "../../utils/context";
import { getRoutesPaths } from "../../router/routes";
import type { LensEntryType, LiveEntry } from "../../types";
import type { LiveStatus } from "../../hooks/useLiveTail";

const TYPE_META: Record<LensEntryType, { label: string; tone: string }> = {
  request: { label: "Request", tone: "text-fg" },
  query: { label: "Query", tone: "text-info" },
  cache: { label: "Cache", tone: "text-accent" },
  exception: { label: "Exception", tone: "text-danger" },
  mail: { label: "Mail", tone: "text-warning" },
  http: { label: "HTTP", tone: "text-success" },
  event: { label: "Event", tone: "text-info" },
  redis: { label: "Redis", tone: "text-warning" },
  fcm: { label: "FCM", tone: "text-accent" },
  log: { label: "Log", tone: "text-muted" },
  job: { label: "Job", tone: "text-info" },
};

const STATUS_META: Record<LiveStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-success/10 text-success" },
  connecting: { label: "Connecting…", cls: "bg-warning/10 text-warning" },
  polling: { label: "Polling (SSE unavailable)", cls: "bg-info/10 text-info" },
  paused: { label: "Paused", cls: "bg-surface-2 text-muted" },
};

function summarize(e: LiveEntry): string {
  const d = e.data || {};
  switch (e.type) {
    case "request":
      return `${d.method ?? ""} ${d.path ?? ""}`.trim();
    case "query":
      return typeof d.query === "string" ? d.query : JSON.stringify(d);
    case "cache":
      return `${d.action ?? ""}${d.data?.key ? ` · ${d.data.key}` : d.key ? ` · ${d.key}` : ""}`.trim();
    case "exception":
      return `${d.name ?? "Error"}${d.message ? `: ${d.message}` : ""}`;
    case "mail":
      return d.subject ?? "(no subject)";
    case "http":
      return `${d.method ?? ""} ${d.url ?? ""}`.trim();
    case "event":
      return d.name ?? "";
    case "redis":
      return `${d.command ?? ""}${d.args?.length ? ` ${d.args.join(" ")}` : ""}`.trim();
    case "fcm":
      return `${d.method ?? ""}${d.target ? ` → ${d.target}` : ""}`.trim();
    case "log":
      return `${d.level ? `[${d.level}] ` : ""}${d.message ?? ""}`.trim();
    case "job":
      return `${d.name ?? ""}${d.status ? ` · ${d.status}` : ""}${d.queue ? ` (${d.queue})` : ""}`.trim();
    default:
      return JSON.stringify(d);
  }
}

export default function LiveTailView({
  items,
  status,
  dropped,
}: {
  items: LiveEntry[];
  status: LiveStatus;
  dropped: number;
}) {
  const navigate = useNavigate();
  const paths = getRoutesPaths(useConfig());
  const [type, setType] = useState<LensEntryType | "all">("all");

  const pathForType = (t: LensEntryType): string =>
    ({
      request: paths.REQUESTS,
      query: paths.QUERIES,
      cache: paths.CACHE_ENTRIES,
      exception: paths.EXCEPTIONS,
      mail: paths.MAIL,
      http: paths.HTTP,
      event: paths.EVENTS,
      redis: paths.REDIS,
      fcm: paths.FCM,
      log: paths.LOGS,
      job: paths.JOBS,
    })[t];

  const rows = useMemo(
    () => (type === "all" ? items : items.filter((i) => i.type === type)),
    [items, type],
  );

  const statusMeta = STATUS_META[status];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            statusMeta.cls,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusMeta.label}
        </span>

        <select
          value={type}
          aria-label="Filter by type"
          onChange={(e) => setType(e.target.value as LensEntryType | "all")}
          className="rounded-lg border border-border bg-surface/70 px-3 py-2 text-sm text-fg transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none"
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_META).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-muted">{rows.length} shown</span>

        {dropped > 0 && (
          <span className="text-xs text-warning">
            high volume — some entries omitted
          </span>
        )}
      </div>

      <div className="card-panel divide-y divide-border overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Waiting for activity…
          </div>
        ) : (
          rows.map((row) => {
            const meta = TYPE_META[row.type];
            const t = humanDifferentDate(row.created_at);
            return (
              <button
                key={row.id}
                onClick={() => navigate(`${pathForType(row.type)}/${row.id}`)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-2/50"
              >
                <span
                  className={cn(
                    "w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide",
                    meta.tone,
                  )}
                >
                  {meta.label}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-fg">
                  {summarize(row)}
                </span>
                <span
                  className="shrink-0 text-xs text-dim"
                  title={t.exact}
                >
                  {t.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
