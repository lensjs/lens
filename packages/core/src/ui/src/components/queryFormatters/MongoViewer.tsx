import { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";
import jsBeautify from "js-beautify";
import { highlightMongo } from "../common/highlights/SqlHighlights";

interface MongoViewerProps {
  query: string;
}

// MongoDB keywords and operators to highlight

function MongoViewer({ query }: MongoViewerProps) {
  const [copied, setCopied] = useState(false);

  const formattedQuery = useMemo(() => {
    try {
      return jsBeautify.js(query, {
        indent_size: 2,
        space_in_empty_paren: true,
        max_preserve_newlines: 2,
      });
    } catch {
      return query;
    }
  }, [query]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const highlightedQuery = useMemo(
    () => highlightMongo(formattedQuery),
    [formattedQuery]
  );

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
        {highlightedQuery}
      </pre>
    </div>
  );
}

export default MongoViewer;
