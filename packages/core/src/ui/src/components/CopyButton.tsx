import { Check, Copy } from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function CopyButton({
  value,
  className,
  label = "Copy",
  size = 13,
}: {
  value: string;
  className?: string;
  label?: string;
  size?: number;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied!" : label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded p-1 text-dim transition-colors hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      {copied ? (
        <Check size={size} className="text-accent" />
      ) : (
        <Copy size={size} />
      )}
    </button>
  );
}

/**
 * Inline value with a copy affordance that appears on hover.
 */
export function CopyableText({
  value,
  display,
  className,
}: {
  value: string;
  display?: ReactNode;
  className?: string;
}) {
  return (
    <span className="group/copy inline-flex max-w-full items-center gap-1.5">
      <span className={cn("min-w-0 break-all", className)}>
        {display ?? value}
      </span>
      <CopyButton
        value={value}
        className="shrink-0 opacity-0 transition-opacity group-hover/copy:opacity-100 focus:opacity-100"
      />
    </span>
  );
}

export default CopyButton;
