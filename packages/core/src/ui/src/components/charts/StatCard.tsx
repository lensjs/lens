import { cn } from "../../utils/cn";
import type { StatTone } from "../StatsBar";

const toneClass: Record<StatTone, string> = {
  default: "text-fg",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  accent: "text-accent",
};

export default function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: StatTone;
}) {
  return (
    <div className="card-panel flex flex-col gap-1 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-dim">
        {label}
      </span>
      <span className={cn("text-2xl font-bold tabular", toneClass[tone])}>
        {value}
      </span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}
