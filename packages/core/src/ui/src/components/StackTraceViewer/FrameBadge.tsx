import React from "react";

interface FrameBadgeProps {
  index: number;
  isFirst: boolean;
}

export const FrameBadge: React.FC<FrameBadgeProps> = ({ index, isFirst }) => (
  <div
    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
      isFirst
        ? "bg-orange-500 text-white"
        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
    }`}
  >
    {index + 1}
  </div>
);
