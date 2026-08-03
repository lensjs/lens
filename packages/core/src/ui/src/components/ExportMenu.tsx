import { useState } from "react";
import { Download } from "lucide-react";
import {
  downloadFile,
  recordsToCsv,
  rowsToRecords,
  timestampSlug,
} from "../utils/export";

/**
 * Export the currently loaded (and server-filtered) rows as JSON or CSV. Exports
 * inherit capture-time redaction, so no sensitive data is re-fetched.
 */
export default function ExportMenu({
  rows,
  name = "lens-export",
}: {
  rows: unknown[];
  name?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!rows.length) return null;

  const exportJson = () => {
    downloadFile(
      `${name}-${timestampSlug()}.json`,
      JSON.stringify(rowsToRecords(rows), null, 2),
      "application/json",
    );
    setOpen(false);
  };

  const exportCsv = () => {
    downloadFile(
      `${name}-${timestampSlug()}.csv`,
      recordsToCsv(rowsToRecords(rows)),
      "text/csv",
    );
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        title="Export loaded rows"
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface/70 px-2.5 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        <Download size={14} />
        Export
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <button
            onMouseDown={exportJson}
            className="block w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
          >
            JSON
          </button>
          <button
            onMouseDown={exportCsv}
            className="block w-full px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
          >
            CSV
          </button>
        </div>
      )}
    </div>
  );
}
