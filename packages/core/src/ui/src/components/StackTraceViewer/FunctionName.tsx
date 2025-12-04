import React from "react";

interface FunctionNameProps {
  functionName: string;
}

export const FunctionName: React.FC<FunctionNameProps> = ({ functionName }) => (
  <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
    <span className="text-blue-600 dark:text-blue-400">{functionName}</span>
  </div>
);
