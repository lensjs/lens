import React from "react";
import { List } from "lucide-react";

export const EmptyState: React.FC = () => (
  <div className="p-4 text-center text-muted bg-surface-2 rounded-lg">
    <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
    <p>No stack trace available</p>
  </div>
);
