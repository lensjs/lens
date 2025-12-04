import { AlertCircle } from "lucide-react";

export const ErrorFallback: React.FC<{
  message: string;
}> = ({ message }) => (
  <div className="p-4 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <div className="flex items-center justify-center gap-2 mb-2">
      <AlertCircle className="w-5 h-5" />
      <span className="font-semibold">Error Loading Code Frame</span>
    </div>
    <p className="text-sm">{message}</p>
  </div>
);
