import type { LogLevel } from "../types";

const LogLevelBadge = ({ level }: { level: LogLevel }) => {
  const colors: Record<LogLevel, string> = {
    trace: "bg-surface-2 text-muted ring-border",
    debug: "bg-surface-2 text-muted ring-border",
    info: "bg-info/10 text-info ring-info/20",
    warn: "bg-warning/10 text-warning ring-warning/20",
    error: "bg-danger/10 text-danger ring-danger/20",
    fatal: "bg-danger/10 text-danger ring-danger/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${colors[level] || colors.info}`}
    >
      {level}
    </span>
  );
};

export default LogLevelBadge;
