import { Pause, Play } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  toggleRecordingPaused,
  useRecordingPaused,
} from "../../hooks/useRecording";

const RecordingToggle = () => {
  const paused = useRecordingPaused();

  return (
    <button
      type="button"
      onClick={toggleRecordingPaused}
      aria-pressed={paused}
      aria-label={paused ? "Resume live updates" : "Pause live updates"}
      title={
        paused
          ? "Paused — new entries won't appear until you resume"
          : "Live — new entries appear automatically. Click to pause."
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        paused
          ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15"
          : "border-border bg-surface-2/60 text-muted hover:border-border-strong hover:text-fg",
      )}
    >
      {paused ? <Play size={14} /> : <Pause size={14} />}
      <span className="hidden sm:inline">{paused ? "Paused" : "Live"}</span>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          paused ? "bg-warning" : "animate-pulse bg-success",
        )}
      />
    </button>
  );
};

export default RecordingToggle;
