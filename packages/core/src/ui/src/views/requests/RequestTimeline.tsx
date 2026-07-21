import {
  Bell,
  Bug,
  Database,
  Globe,
  Layers,
  Mail,
  Server,
  Zap,
} from "lucide-react";
import { humanDifferentDate } from "@lensjs/date";
import type { OneRequest } from "../../types";
import { cn } from "../../utils/cn";

type EventKind =
  | "query"
  | "cache"
  | "exception"
  | "mail"
  | "http"
  | "event"
  | "redis"
  | "fcm";

type TimelineEvent = {
  id: string;
  time: string;
  kind: EventKind;
  label: string;
  sub?: string;
};

const KIND_META: Record<
  EventKind,
  { icon: typeof Database; tone: string; label: string }
> = {
  query: { icon: Database, tone: "text-info", label: "Query" },
  cache: { icon: Layers, tone: "text-accent", label: "Cache" },
  exception: { icon: Bug, tone: "text-danger", label: "Exception" },
  mail: { icon: Mail, tone: "text-warning", label: "Mail" },
  http: { icon: Globe, tone: "text-success", label: "HTTP" },
  event: { icon: Zap, tone: "text-info", label: "Event" },
  redis: { icon: Server, tone: "text-warning", label: "Redis" },
  fcm: { icon: Bell, tone: "text-accent", label: "FCM" },
};

export default function RequestTimeline({ request }: { request: OneRequest }) {
  const events: TimelineEvent[] = [
    ...request.queries.map((q, i) => ({
      id: `q${i}`,
      time: q.data.createdAt,
      kind: "query" as const,
      label: q.data.query,
      sub: q.data.duration,
    })),
    ...request.cacheEntries.map((c, i) => ({
      id: `c${i}`,
      time: c.data.createdAt,
      kind: "cache" as const,
      label: `${c.data.action}${c.data.data?.key ? ` · ${c.data.data.key}` : ""}`,
    })),
    ...request.exceptions.map((e, i) => ({
      id: `e${i}`,
      time: e.data.createdAt,
      kind: "exception" as const,
      label: e.data.name,
      sub: e.data.message,
    })),
    ...request.emails.map((m, i) => ({
      id: `m${i}`,
      time: m.created_at,
      kind: "mail" as const,
      label: m.data.subject ?? "(no subject)",
    })),
    ...(request.httpEntries ?? []).map((h, i) => ({
      id: `h${i}`,
      time: h.data.createdAt,
      kind: "http" as const,
      label: `${h.data.method} ${h.data.url}`,
      sub:
        h.data.status != null
          ? `${h.data.status} · ${h.data.duration}`
          : h.data.duration,
    })),
    ...(request.eventEntries ?? []).map((e, i) => ({
      id: `ev${i}`,
      time: e.data.createdAt,
      kind: "event" as const,
      label: e.data.name,
    })),
    ...(request.redisEntries ?? []).map((r, i) => ({
      id: `r${i}`,
      time: r.data.createdAt,
      kind: "redis" as const,
      label: `${r.data.command}${r.data.args?.length ? ` ${r.data.args.join(" ")}` : ""}`,
      sub: `${r.data.status} · ${r.data.duration}`,
    })),
    ...(request.fcmEntries ?? []).map((f, i) => ({
      id: `f${i}`,
      time: f.data.createdAt,
      kind: "fcm" as const,
      label: `${f.data.method}${f.data.target ? ` → ${f.data.target}` : ""}`,
      sub: `${f.data.status} · ${f.data.duration}`,
    })),
  ]
    .filter((e) => e.time)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  if (!events.length) return null;

  return (
    <div className="card-panel overflow-hidden">
      <div className="border-b border-border bg-surface-2/40 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Timeline ({events.length})
        </h2>
      </div>
      <ol className="relative space-y-1 p-5">
        <span
          className="absolute bottom-6 left-[34px] top-6 w-px bg-border"
          aria-hidden
        />
        {events.map((ev) => {
          const meta = KIND_META[ev.kind];
          const Icon = meta.icon;
          const t = humanDifferentDate(ev.time);
          return (
            <li key={ev.id} className="relative flex gap-3">
              <span
                className={cn(
                  "z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface",
                  meta.tone,
                )}
              >
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-dim">
                    {meta.label}
                  </span>
                  <span className="text-xs text-dim" title={t.exact}>
                    {t.label}
                  </span>
                </div>
                <p className="truncate font-mono text-sm text-fg">{ev.label}</p>
                {ev.sub && <p className="truncate text-xs text-muted">{ev.sub}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
