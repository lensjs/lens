import { AlertCircle, RotateCcw } from "lucide-react";

export const ErrorFallback: React.FC<{
  message: string;
  title?: string;
  onRetry?: () => void;
}> = ({ message, title = "Something went wrong", onRetry }) => (
  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
    <div className="mb-2 flex items-center justify-center gap-2 text-red-400">
      <AlertCircle className="h-5 w-5" />
      <span className="font-semibold">{title}</span>
    </div>
    <p className="break-words text-sm text-red-300/90">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Try again
      </button>
    )}
  </div>
);
