/** Parse a human duration string (e.g. "200 ms", "1.5 s") into milliseconds. */
export function durationToMs(duration?: string | number): number {
  if (duration == null) return 0;
  if (typeof duration === "number") return duration;

  const match = String(duration)
    .trim()
    .match(/([\d.]+)\s*(ms|s|µs|us|ns|m|min)?/i);
  if (!match || !match[1]) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "ms").toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
    case "min":
      return value * 60_000;
    case "us":
    case "µs":
      return value / 1000;
    case "ns":
      return value / 1_000_000;
    default:
      return value;
  }
}

/** Bucket an HTTP status code into a class label (2xx, 3xx, 4xx, 5xx). */
export function statusClass(status?: number): string {
  if (!status) return "other";
  if (status < 300) return "2xx";
  if (status < 400) return "3xx";
  if (status < 500) return "4xx";
  return "5xx";
}

/** Millisecond timestamp for sorting; tolerant of undefined/invalid. */
export function toTime(value?: string): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}
