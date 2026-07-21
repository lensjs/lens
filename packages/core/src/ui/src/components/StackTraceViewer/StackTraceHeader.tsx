import React from "react";
import { List } from "lucide-react";

interface StackTraceHeaderProps {
  frameCount: number;
}

export const StackTraceHeader: React.FC<StackTraceHeaderProps> = ({
  frameCount,
}) => (
  <div className="px-4 py-2 bg-gradient-to-r from-surface-2 to-elevated border-b border-border">
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <List className="w-4 h-4 text-warning" />
        <span className="font-semibold text-warning">
          Stack Trace
        </span>
      </div>
      <div className="h-4 w-px bg-border-strong"></div>
      <span className="text-muted text-xs">
        {frameCount} stack frame{frameCount !== 1 ? "s" : ""}
      </span>
    </div>
  </div>
);
