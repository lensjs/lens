import type { ReactNode } from "react";

/**
 * Shared page header: title + short description on the left, optional actions
 * (live state, controls) on the right. Used at the top of every watcher page so
 * the shell stays consistent.
 */
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-fg">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
