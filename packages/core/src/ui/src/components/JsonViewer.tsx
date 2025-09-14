"use client";

import type React from "react";
import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { nordTheme } from "@uiw/react-json-view/nord";
import { Check, Copy } from "lucide-react";
import CopyTypeButton from "./CopyTypeButton";

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
    <div className="bg-neutral-50 dark:bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto overflow-y-visible relative">
      <div className="absolute top-3 right-3 flex gap-2">
        <CopyTypeButton data={data} />
        <button
          onClick={copyToClipboard}
          className={`p-2 rounded-md transition-colors ${
            copied
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700"
          }`}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? <Check size={15} /> : <Copy />}
        </button>
      </div>
      <div className="whitespace-pre-wrap pr-20 text-neutral-800 dark:text-neutral-200 min-h-10">
        {typeof data === "string" || Array.isArray(data) ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <JsonView
            value={data}
            enableClipboard={false}
            style={nordTheme}
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
