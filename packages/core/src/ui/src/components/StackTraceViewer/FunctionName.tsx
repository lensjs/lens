import React from "react";

interface FunctionNameProps {
  functionName: string;
}

export const FunctionName: React.FC<FunctionNameProps> = ({ functionName }) => (
  <div className="font-mono text-sm font-medium text-fg mb-1">
    <span className="text-accent">{functionName}</span>
  </div>
);
