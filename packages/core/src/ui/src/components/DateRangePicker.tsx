import { useState } from "react";
import { CalendarRange } from "lucide-react";

type Preset = { id: string; label: string; ms: number };

const PRESETS: Preset[] = [
  { id: "15m", label: "Last 15 min", ms: 15 * 60 * 1000 },
  { id: "1h", label: "Last hour", ms: 60 * 60 * 1000 },
  { id: "24h", label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
  { id: "7d", label: "Last 7 days", ms: 7 * 24 * 60 * 60 * 1000 },
];

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO string -> `datetime-local` input value (local time). */
function toInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

const fromInput = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

const selectClass =
  "rounded-lg border border-border bg-surface/70 px-3 py-2 text-sm text-fg transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none";

/**
 * Date-range control writing absolute ISO `from`/`to` bounds (deep-linkable).
 * Presets set a relative lower bound up to now; "Custom" exposes both bounds.
 */
export default function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string | null, to: string | null) => void;
}) {
  const [custom, setCustom] = useState<boolean>(!!from || !!to);
  const [presetId, setPresetId] = useState<string>("");

  const onPreset = (id: string) => {
    if (id === "") {
      setCustom(false);
      setPresetId("");
      onChange(null, null);
      return;
    }
    if (id === "custom") {
      setCustom(true);
      setPresetId("");
      return;
    }
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) {
      setCustom(false);
      setPresetId(id);
      onChange(new Date(Date.now() - preset.ms).toISOString(), null);
    }
  };

  // Keep the chosen preset selected in-session; fall back to "Any time" once the
  // range is cleared elsewhere (e.g. the toolbar's Clear button empties `from`).
  const selectValue = custom ? "custom" : from ? presetId : "";

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <CalendarRange
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim"
        />
        <select
          aria-label="Date range"
          value={selectValue}
          onChange={(e) => onPreset(e.target.value)}
          className={`${selectClass} pl-8`}
        >
          <option value="">Any time</option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
      </div>

      {custom && (
        <div className="flex items-center gap-1">
          <input
            type="datetime-local"
            aria-label="From"
            value={toInput(from)}
            onChange={(e) => onChange(fromInput(e.target.value), to || null)}
            className={selectClass}
          />
          <span className="text-xs text-dim">to</span>
          <input
            type="datetime-local"
            aria-label="To"
            value={toInput(to)}
            onChange={(e) => onChange(from || null, fromInput(e.target.value))}
            className={selectClass}
          />
        </div>
      )}
    </div>
  );
}
