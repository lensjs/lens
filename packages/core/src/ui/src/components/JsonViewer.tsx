"use client";

import type React from "react";
import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { nordTheme } from "@uiw/react-json-view/nord";
import { Check } from "lucide-react";

interface JsonViewerProps {
  data: Record<string, unknown> | string | string[];
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const [typeCopied, setTypeCopied] = useState(false);

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

  const getDataType = (
    value: Record<string, unknown> | string | string[] | unknown
  ): string => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) {
      // For arrays, show the type of elements
      if (value.length === 0) return "[]";
      const elementTypes = [...new Set(value.map((item) => getDataType(item)))];
      if (elementTypes.length === 1) {
        return `${elementTypes[0]}[]`;
      }
      return `(${elementTypes.join(" | ")})[]`;
    }
    if (typeof value === "object" && value !== null) {
      // For objects, create a type structure
      const typeStructure: Record<string, string> = {};
      for (const [key, val] of Object.entries(value)) {
        typeStructure[key] = getDataType(val);
      }
      // Convert to string and remove quotes from type values
      const jsonString = JSON.stringify(typeStructure, null, 2);
      return jsonString.replace(
        /"(string|number|boolean|null|undefined|bigint|symbol)"/g,
        "$1"
      );
    }
    return typeof value;
  };

  const copyDataType = async () => {
    try {
      const dataType = getDataType(data);
      await navigator.clipboard.writeText(dataType);
      setTypeCopied(true);
      setTimeout(() => setTypeCopied(false), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy data type: ", err);
    }
  };

  const CopyIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );

  return (
    <div className="bg-neutral-50 dark:bg-slate-900 rounded-lg p-4 font-mono text-sm overflow-x-auto relative">
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          onClick={copyDataType}
          className={`p-2 rounded-md transition-colors ${
            typeCopied
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700"
          }`}
          title={
            typeCopied
              ? "Type copied!"
              : `Copy data type (${getDataType(data)})`
          }
        >
          {typeCopied ? <Check size={15} /> : <>TS</>}
        </button>
        <button
          onClick={copyToClipboard}
          className={`p-2 rounded-md transition-colors ${
            copied
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-white text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:bg-slate-800 dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-slate-700"
          }`}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? <Check size={15} /> : <CopyIcon />}
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
