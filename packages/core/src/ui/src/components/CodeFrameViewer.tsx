import React from "react";
import { AlertCircle, FileText } from "lucide-react";
import type { ExceptionEntry } from "../types";
import {
  getClassName,
  highlightCode,
} from "./common/highlights/CodeHighlights";
import { ErrorFallback } from "./common/ErrorFallback";

interface CodeFrameViewerProps {
  codeFrame: ExceptionEntry["codeFrame"];
}

// Syntax highlighting component
const SyntaxHighlighter: React.FC<{ code: string }> = ({ code }) => {
  try {
    const tokens = highlightCode(code);

    return (
      <code className="font-mono text-sm leading-5 whitespace-pre tracking-normal">
        {tokens.map((token, index) => (
          <span key={index} className={getClassName(token.type)}>
            {token.text}
          </span>
        ))}
      </code>
    );
  } catch (error) {
    console.error("Error rendering syntax highlighter:", error);
    return (
      <code className="font-mono text-sm leading-5 whitespace-pre text-gray-800 dark:text-gray-200">
        {code}
      </code>
    );
  }
};

// Header component
const CodeFrameHeader: React.FC<{
  file: string;
  line: number;
  column: number;
}> = ({ file, line, column }) => (
  <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
        <span className="font-semibold text-red-600 dark:text-red-400">
          Error Location
        </span>
      </div>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <div className="font-mono text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs truncate max-w-xs" title={file}>
        {file || "Unknown file"}
      </div>
      <span className="text-gray-500 dark:text-gray-400 text-xs">
        Line {line || "?"}:{column || "?"}
      </span>
    </div>
  </div>
);

// Error indicator component
const ErrorIndicator: React.FC<{
  column: number;
  codeLine: string;
}> = ({ column }) => (
  <div className="mt-2">
    <div
      className="absolute flex items-center gap-2 z-20"
      style={{
        left: `${Math.max(0, (column - 1) * 0.6)}em`,
      }}
    >
      <span className="text-red-500 -mt-2 dark:text-red-400 font-semibold  font-mono">
        {"^"}
      </span>
    </div>
  </div>
);

// Code line component
const CodeLine: React.FC<{
  codeLine: string;
  lineNumber: number;
  isErrorLine: boolean;
  column?: number;
}> = ({ codeLine, lineNumber, isErrorLine, column }) => (
  <div
    className={`flex group ${
      isErrorLine
        ? "bg-red-50 dark:bg-red-950/30"
        : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
    }`}
  >
    {/* Line number */}
    <div
      className={`flex-shrink-0 w-16 py-1 px-3 text-right select-none text-sm font-mono tabular-nums border-r ${
        isErrorLine
          ? "text-red-500 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700"
          : "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 group-hover:bg-gray-100 dark:group-hover:bg-gray-700"
      }`}
    >
      {lineNumber}
    </div>

    {/* Code content */}
    <div className="flex-1 py-1 px-3 relative min-h-[1.5rem] flex items-start overflow-hidden">
      <div className="w-full font-mono text-sm">
        <SyntaxHighlighter code={codeLine || ""} />
        {isErrorLine && column && (
          <ErrorIndicator column={column} codeLine={codeLine || ""} />
        )}
      </div>
    </div>
  </div>
);

// Footer component
const CodeFrameFooter: React.FC<{
  totalLines: number;
}> = ({ totalLines }) => (
  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs">
    <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
      <span className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        Error line highlighted :<span>{totalLines} lines of context</span>
      </span>
    </div>
  </div>
);

// Error fallback component

// Empty state component
const EmptyState: React.FC<{
  message: string;
}> = ({ message }) => (
  <div className="p-4 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
    <p>{message}</p>
  </div>
);

// Main component
const CodeFrameViewer: React.FC<CodeFrameViewerProps> = ({ codeFrame }) => {
  if (!codeFrame) {
    return <EmptyState message="No code frame available" />;
  }

  try {
    const { file, line, column, context } = codeFrame;

    if (!context || (!context.pre && !context.error && !context.post)) {
      return <EmptyState message="No code context available" />;
    }

    const { pre, error, post } = context;
    const allLines = [...(pre || []), error || "", ...(post || [])];
    const errorLineIndex = (pre || []).length;

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
        <CodeFrameHeader
          file={file || ""}
          line={line || 0}
          column={column || 0}
        />

        {/* Code content */}
        <div className="overflow-auto max-h-80 font-mono">
          <div className="relative">
            {allLines.map((codeLine, index) => {
              const currentLineNumber = (line || 1) - errorLineIndex + index;
              const isErrorLine = index === errorLineIndex;

              return (
                <CodeLine
                  key={index}
                  codeLine={codeLine}
                  lineNumber={currentLineNumber}
                  isErrorLine={isErrorLine}
                  column={isErrorLine ? column : undefined}
                />
              );
            })}
          </div>
        </div>

        <CodeFrameFooter totalLines={allLines.length} />
      </div>
    );
  } catch (error) {
    console.error("Error rendering CodeFrameViewer:", error);
    return (
      <ErrorFallback message="Unable to display code context. Please check the console for details." />
    );
  }
};

export default CodeFrameViewer;
