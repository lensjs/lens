import React from "react";
import { EmptyState } from "./EmptyState";
import { StackTraceHeader } from "./StackTraceHeader";
import { StackFrame } from "./StackFrame";
import { StackTraceFooter } from "./StackTraceFooter";
import { ErrorFallback } from "../common/ErrorFallback";

interface StackTraceViewerProps {
  trace: string[];
}

const StackTraceViewer: React.FC<StackTraceViewerProps> = ({ trace }) => {
  if (!trace || trace.length === 0) {
    return <EmptyState />;
  }

  try {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
        <StackTraceHeader frameCount={trace.length} />

        {/* Stack trace content */}
        <div className="overflow-auto max-h-96">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {trace.map((line, index) => (
              <StackFrame
                key={index}
                line={line}
                index={index}
                isFirst={index === 0}
              />
            ))}
          </div>
        </div>

        <StackTraceFooter traceDepth={trace.length} />
      </div>
    );
  } catch (error) {
    console.error("Error rendering StackTraceViewer:", error);
    return (
      <ErrorFallback message="Unable to display stack trace. Please check the console for details." />
    );
  }
};

export default StackTraceViewer;
