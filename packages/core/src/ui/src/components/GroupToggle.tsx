import { useSearchParams } from "react-router-dom";
import { cn } from "../utils/cn";

/**
 * Segmented "All / Grouped" control for the Exceptions page. Writes `group=1`
 * to the URL and clears any active `fingerprint` drill-down when switching.
 */
export default function GroupToggle() {
  const [params, setParams] = useSearchParams();
  const grouped = params.get("group") === "1";

  const set = (on: boolean) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (on) next.set("group", "1");
        else next.delete("group");
        next.delete("fingerprint");
        return next;
      },
      { replace: true },
    );
  };

  const base = "px-3 py-2 text-sm transition-colors";
  const active = "bg-accent/10 text-fg";
  const idle = "text-muted hover:text-fg";

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border bg-surface/70">
      <button
        type="button"
        onClick={() => set(false)}
        className={cn(base, !grouped ? active : idle)}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => set(true)}
        className={cn(base, "border-l border-border", grouped ? active : idle)}
      >
        Grouped
      </button>
    </div>
  );
}
