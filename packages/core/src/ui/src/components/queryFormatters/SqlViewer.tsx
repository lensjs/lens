"use client";

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
    <div className="bg-neutral-50 dark:bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto relative">
      <button
        onClick={copyToClipboard}
        className={`absolute top-3 right-3 p-2 rounded-md transition-colors ${
          copied
            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            : "bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700"
        }`}
        title={copied ? "Copied!" : "Copy to clipboard"}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <pre className="whitespace-pre-wrap pr-12 text-neutral-800 dark:text-neutral-200">
        {highlightedSql}
      </pre>
    </div>
  );
};

export default SqlViewer;
