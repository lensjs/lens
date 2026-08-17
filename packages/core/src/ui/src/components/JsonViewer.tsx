import type React from "react";
import { useMemo, useState } from "react";
import JsonView from "@uiw/react-json-view";
import { nordTheme } from "@uiw/react-json-view/nord";
import { Check, Copy } from "lucide-react";
import { cn } from "../utils/cn";

interface JsonViewerProps {
  data: unknown;
}

// Neutral + emerald JSON palette (no blue). Spread the dark nord base for any
// structural vars we do not override, then recolor the visible tokens.
const lensJsonTheme = {
  ...nordTheme,
  "--w-rjv-background-color": "transparent",
  "--w-rjv-color": "#a1a1aa",
  "--w-rjv-key-string": "#e4e4e7",
  "--w-rjv-line-color": "#26262a",
  "--w-rjv-arrow-color": "#71717a",
  "--w-rjv-info-color": "#71717a",
  "--w-rjv-brackets-color": "#a1a1aa",
  "--w-rjv-curlybraces-color": "#a1a1aa",
  "--w-rjv-colon-color": "#a1a1aa",
  "--w-rjv-quotes-color": "#34d399",
  "--w-rjv-quotes-string-color": "#34d399",
  "--w-rjv-type-string-color": "#34d399",
  "--w-rjv-type-int-color": "#fbbf24",
  "--w-rjv-type-float-color": "#fbbf24",
  "--w-rjv-type-bigint-color": "#fbbf24",
  "--w-rjv-type-boolean-color": "#a78bfa",
  "--w-rjv-type-date-color": "#a78bfa",
  "--w-rjv-type-url-color": "#34d399",
  "--w-rjv-type-null-color": "#fb7185",
  "--w-rjv-type-nan-color": "#fb7185",
  "--w-rjv-type-undefined-color": "#fb7185",
} as React.CSSProperties;

// Request/response bodies and headers are frequently captured as JSON *strings*.
// Decode them so the viewer shows a real tree instead of an escaped string
// literal (e.g. "{\"ok\":true}"). Genuine plain strings are left untouched.
function normalizeJson(data: unknown): unknown {
  if (typeof data !== "string") return data;

  const trimmed = data.trim();
  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (looksLikeJson) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* not valid JSON — render the raw string */
    }
  }

  return data;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const value = useMemo(() => normalizeJson(data), [data]);
  const isTree = typeof value === "object" && value !== null;
  const rawText = typeof value === "string" ? value : String(value ?? "");

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(
        isTree ? JSON.stringify(value, null, 2) : rawText,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="relative overflow-x-auto overflow-y-visible rounded-lg border border-border bg-canvas p-4 font-mono text-sm">
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          onClick={copyToClipboard}
          className={cn(
            "rounded-md border p-1.5 transition-colors",
            copied
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border bg-surface-2 text-muted hover:bg-elevated hover:text-fg",
          )}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="min-h-10 whitespace-pre-wrap pr-20 text-fg">
        {isTree ? (
          <JsonView
            value={value as object}
            enableClipboard={false}
            style={lensJsonTheme}
            collapsed={false}
            displayDataTypes={false}
            displayObjectSize={false}
          />
        ) : (
          <pre className="text-fg">{rawText}</pre>
        )}
      </div>
    </div>
  );
};

export default JsonViewer;
