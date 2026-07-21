import { Check, Copy } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { highlightSql } from "../common/highlights/SqlHighlights";

// --- Syntax highlighter ---

interface SqlViewerProps {
  sql: string;
}

const SqlViewer: React.FC<SqlViewerProps> = ({ sql }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const highlightedSql = useMemo(() => highlightSql(sql), [sql]);

  return (
    <div className="bg-surface rounded-lg p-4 font-mono text-sm overflow-x-auto relative">
      <button
        onClick={copyToClipboard}
        className={`absolute top-3 right-3 p-2 rounded-md transition-colors ${
          copied
            ? "bg-success/10 text-success"
            : "bg-surface-2 text-muted hover:text-fg hover:bg-elevated"
        }`}
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <pre className="whitespace-pre-wrap pr-12 text-fg">
        {highlightedSql}
      </pre>
    </div>
  );
};

export default SqlViewer;
