"use client";

import type React from "react";
import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { nordTheme } from "@uiw/react-json-view/nord";
import { Check, Copy } from "lucide-react";

interface JsonViewerProps {
  data: Record<string, unknown> | string | string[];
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto overflow-y-visible relative shadow-inner">
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={copyToClipboard}
          className={`p-1.5 rounded-md transition-colors border ${
            copied
              ? "bg-green-900/30 text-green-400 border-green-800/50"
              : "bg-slate-800 text-slate-400 hover:text-slate-100 border-slate-700 hover:bg-slate-700"
          }`}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="whitespace-pre-wrap pr-20 text-slate-300 min-h-10">
        {typeof data === "string" || Array.isArray(data) ? (
          <pre className="text-slate-300">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <JsonView
            value={data}
            enableClipboard={false}
            style={{
                ...nordTheme,
                '--w-rjv-background-color': 'transparent',
            } as any}
            collapsed={false}
            displayDataTypes={false}
            displayObjectSize={false}
          />
        )}
      </div>
    </div>
  );
};

export default JsonViewer;
