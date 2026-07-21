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
      <code className="font-mono text-sm leading-5 whitespace-pre text-fg">
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
  <div className="px-4 py-2 bg-gradient-to-r from-surface-2 to-elevated border-b border-border">
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-danger" />
        <span className="font-semibold text-danger">
          Error Location
        </span>
      </div>
      <div className="h-4 w-px bg-border-strong"></div>
      <div className="font-mono text-fg bg-elevated px-2 py-1 rounded text-xs truncate max-w-xs" title={file}>
        {file || "Unknown file"}
      </div>
      <span className="text-muted text-xs">
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
      <span className="text-danger -mt-2 font-semibold font-mono">
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
        ? "bg-danger/10"
        : "hover:bg-surface-2/30"
    }`}
  >
    {/* Line number */}
    <div
      className={`flex-shrink-0 w-16 py-1 px-3 text-right select-none text-sm font-mono tabular-nums border-r ${
        isErrorLine
          ? "text-danger font-bold bg-danger/20 border-danger/40"
          : "text-muted bg-surface-2 border-border group-hover:bg-elevated"
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
  <div className="px-4 py-2 bg-surface-2 border-t border-border text-xs">
    <div className="flex items-center justify-between text-muted">
      <span className="flex items-center gap-2">
        <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
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
  <div className="p-4 text-center text-muted bg-surface-2 rounded-lg">
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
      <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-lg">
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
