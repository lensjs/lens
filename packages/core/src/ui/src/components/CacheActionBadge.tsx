import type { CacheAction } from "../types";

const CacheActionBadge = ({ action }: { action: CacheAction }) => {
  const colors: Record<CacheAction, string> = {
    hit: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    miss: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    write: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    delete: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    clear: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${
        colors[action] || colors.clear
      }`}
    >
      {action}
    </span>
  );
};

export default CacheActionBadge;
