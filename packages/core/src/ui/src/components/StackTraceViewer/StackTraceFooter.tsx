import React from "react";

interface StackTraceFooterProps {
  traceDepth: number;
}

export const StackTraceFooter: React.FC<StackTraceFooterProps> = ({
  traceDepth,
}) => (
  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs">
    <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          Call stack from error origin
        </span>
        <span>Trace depth: {traceDepth}</span>
      </div>
      <span className="font-mono">Stack Trace</span>
    </div>
  </div>
);
