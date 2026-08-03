import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Overview } from "../../types";
import type { StatTone } from "../../components/StatsBar";
import { useConfig } from "../../utils/context";
import { getRoutesPaths } from "../../router/routes";
import { useListView } from "../../hooks/useListView";
import DateRangePicker from "../../components/DateRangePicker";
import StatCard from "../../components/charts/StatCard";
import AreaChart from "../../components/charts/AreaChart";
import BarList from "../../components/charts/BarList";

const fmtMs = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
const fmtPct = (ratio: number) => `${(ratio * 100).toFixed(1)}%`;
const fmtRpm = (rpm: number) =>
  rpm >= 10 ? Math.round(rpm).toString() : rpm.toFixed(1);

function errorTone(rate: number): StatTone {
  if (rate >= 0.05) return "danger";
  if (rate > 0) return "warning";
  return "success";
}

function Panel({
  title,
  children,
  padded = true,
}: {
  title: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div className="card-panel overflow-hidden">
      <div className="border-b border-border bg-surface-2/40 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h2>
      </div>
      <div className={padded ? "p-4" : ""}>{children}</div>
    </div>
  );
}

export default function OverviewView({ overview }: { overview: Overview }) {
  const navigate = useNavigate();
  const paths = getRoutesPaths(useConfig());
  const controls = useListView<never>([], {});
  const { summary, throughput, latencyTrend } = overview;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-fg">Overview</h1>
        <DateRangePicker
          from={controls.from}
          to={controls.to}
          onChange={controls.setDateRange}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Requests"
          value={summary.totalRequests}
          sub={`${fmtRpm(summary.requestsPerMinute)} / min`}
        />
        <StatCard
          label="Error rate"
          value={fmtPct(summary.errorRate)}
          tone={errorTone(summary.errorRate)}
          sub="5xx responses"
        />
        <StatCard label="p50 latency" value={fmtMs(summary.p50)} tone="info" />
        <StatCard label="p95 latency" value={fmtMs(summary.p95)} tone="warning" />
        <StatCard label="p99 latency" value={fmtMs(summary.p99)} tone="warning" />
        <StatCard
          label="Exceptions"
          value={summary.totalExceptions}
          tone={summary.totalExceptions ? "danger" : "success"}
          sub={`${summary.totalQueries} queries`}
        />
      </div>

      <Panel title={`Requests over time (per ${overview.range.granularity})`}>
        <AreaChart
          data={throughput.map((p) => ({ label: p.bucket, value: p.total }))}
          secondary={throughput.map((p) => p.errors)}
        />
        <div className="mt-2 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" /> Requests
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" /> Errors (5xx)
          </span>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="p95 latency over time">
          <AreaChart
            data={latencyTrend.map((p) => ({ label: p.bucket, value: p.p95 }))}
            primaryClass="text-warning"
          />
        </Panel>
        <Panel title="Slowest endpoints (p95)" padded={false}>
          <BarList
            items={overview.slowestEndpoints.map((e) => ({
              label: `${e.method} ${e.path}`,
              value: e.p95,
              sub: `${e.count}x`,
              onClick: () =>
                navigate(
                  `${paths.REQUESTS}?q=${encodeURIComponent(e.path)}`,
                ),
            }))}
            formatValue={fmtMs}
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Slowest queries" padded={false}>
          <BarList
            items={overview.slowestQueries.map((q) => ({
              label: q.query,
              value: q.duration,
              onClick: () => navigate(`${paths.QUERIES}/${q.id}`),
            }))}
            formatValue={fmtMs}
          />
        </Panel>
        <Panel title="Top exceptions" padded={false}>
          <BarList
            items={overview.topExceptions.map((e) => ({
              label: e.name,
              value: e.count,
              sub: e.message,
              title: `${e.name}: ${e.message}`,
              onClick: () => navigate(`${paths.EXCEPTIONS}/${e.sampleId}`),
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
