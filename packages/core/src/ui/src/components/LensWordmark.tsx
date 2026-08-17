import { cn } from "../utils/cn";

/**
 * LensJS wordmark — "Lens" in the foreground color, "JS" in the brand gradient.
 * Rendered as text so it inherits the UI font and stays crisp at any size.
 */
export function LensWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-semibold tracking-tight text-fg",
        className,
      )}
      aria-label="LensJS"
    >
      Lens<span className="lens-gradient-text">JS</span>
    </span>
  );
}

export default LensWordmark;
