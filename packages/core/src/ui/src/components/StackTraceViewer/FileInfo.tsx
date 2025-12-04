import React from "react";
import { FileText } from "lucide-react";

interface FileInfoProps {
  file: string;
  line?: string;
  column?: string;
}

export const FileInfo: React.FC<FileInfoProps> = ({ file, line, column }) => (
  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-1">
    <FileText className="w-3 h-3" />
    <span className="font-mono truncate max-w-xs" title={file}>
      {file}
    </span>
    {line && (
      <>
        <span>•</span>
        <span className="font-mono">
          {line}
          {column ? `:${column}` : ""}
        </span>
      </>
    )}
  </div>
);
