import React from "react";
import { List } from "lucide-react";

interface StackTraceHeaderProps {
  frameCount: number;
}

export const StackTraceHeader: React.FC<StackTraceHeaderProps> = ({
  frameCount,
}) => (
  <div className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <List className="w-4 h-4 text-orange-500 dark:text-orange-400" />
        <span className="font-semibold text-orange-600 dark:text-orange-400">
          Stack Trace
        </span>
      </div>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
      <span className="text-gray-500 dark:text-gray-400 text-xs">
        {frameCount} stack frame{frameCount !== 1 ? "s" : ""}
      </span>
    </div>
  </div>
);
