import React from "react";

interface FrameBadgeProps {
  index: number;
  isFirst: boolean;
}

export const FrameBadge: React.FC<FrameBadgeProps> = ({ index, isFirst }) => (
  <div
    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
      isFirst
        ? "bg-warning text-fg"
        : "bg-elevated text-muted"
    }`}
  >
    {index + 1}
  </div>
);
