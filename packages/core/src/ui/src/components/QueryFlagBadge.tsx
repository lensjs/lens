export type QueryFlag = "slow" | "duplicate" | "n+1";

const META: Record<QueryFlag, { label: string; cls: string }> = {
  slow: { label: "Slow", cls: "bg-warning/10 text-warning ring-warning/20" },
  duplicate: { label: "Duplicate", cls: "bg-info/10 text-info ring-info/20" },
  "n+1": { label: "N+1", cls: "bg-danger/10 text-danger ring-danger/20" },
};

const QueryFlagBadge = ({ flag }: { flag: QueryFlag }) => {
  const meta = META[flag];

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
};

export default QueryFlagBadge;
