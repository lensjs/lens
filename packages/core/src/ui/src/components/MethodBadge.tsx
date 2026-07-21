const BADGE =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ring-1 ring-inset";

export default function RequestMethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-info/10 text-info ring-info/20",
    POST: "bg-success/10 text-success ring-success/20",
    PUT: "bg-warning/10 text-warning ring-warning/20",
    PATCH: "bg-warning/10 text-warning ring-warning/20",
    DELETE: "bg-danger/10 text-danger ring-danger/20",
  };

  const normalized = method.toUpperCase();
  const color = colors[normalized] ?? "bg-surface-2 text-muted ring-border";

  return <span className={`${BADGE} ${color}`}>{normalized}</span>;
}
