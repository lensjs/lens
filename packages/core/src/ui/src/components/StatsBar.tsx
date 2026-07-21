import { cn } from "../utils/cn";

export type StatTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

export type Stat = {
  label: string;
  value: string | number;
  tone?: StatTone;
};

const toneClass: Record<StatTone, string> = {
  default: "text-fg",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  accent: "text-accent",
};

export default function StatsBar({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-1.5"
        >
          <span className="text-xs text-dim">{stat.label}</span>
          <span
            className={cn(
              "text-sm font-semibold tabular",
              toneClass[stat.tone ?? "default"],
            )}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
