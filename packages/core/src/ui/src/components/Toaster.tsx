import { AlertTriangle, X } from "lucide-react";
import { dismissToast, useToasts } from "../utils/toast";

/** App-wide toast stack (dark-only), fed by the toast store. */
export default function Toaster() {
  const toasts = useToasts();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 rounded-lg border border-danger/30 bg-surface p-3 shadow-lg"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <button
            onClick={() => {
              t.onClick?.();
              dismissToast(t.id);
            }}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-sm font-semibold text-fg">{t.title}</p>
            {t.description && (
              <p className="truncate text-xs text-muted">{t.description}</p>
            )}
          </button>
          <button
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
            className="shrink-0 text-muted transition-colors hover:text-fg"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
