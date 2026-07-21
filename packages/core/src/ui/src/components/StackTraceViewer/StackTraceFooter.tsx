import React from "react";

interface StackTraceFooterProps {
  traceDepth: number;
}

export const StackTraceFooter: React.FC<StackTraceFooterProps> = ({
  traceDepth,
}) => (
  <div className="px-4 py-2 bg-surface-2 border-t border-border text-xs">
    <div className="flex items-center justify-between text-muted">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-warning rounded-full"></div>
          Call stack from error origin
        </span>
        <span>Trace depth: {traceDepth}</span>
      </div>
      <span className="font-mono">Stack Trace</span>
    </div>
  </div>
);
