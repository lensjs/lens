export type AreaPoint = { label: string; value: number };

/**
 * A dependency-free responsive area+line chart. Renders a primary series (as a
 * filled area) and an optional secondary series (as a line overlay, e.g.
 * errors). Uses a 0..100 viewBox stretched to the container width, with
 * non-scaling strokes so lines stay crisp. Theme tokens only (dark-mode safe).
 */
export default function AreaChart({
  data,
  secondary,
  height = 160,
  primaryClass = "text-accent",
  secondaryClass = "text-danger",
}: {
  data: AreaPoint[];
  secondary?: number[];
  height?: number;
  primaryClass?: string;
  secondaryClass?: string;
}) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ height }}
      >
        No activity in this range.
      </div>
    );
  }

  const W = 100;
  const H = 100;
  const max = Math.max(
    1,
    ...data.map((d) => d.value),
    ...(secondary ?? []),
  );
  const n = data.length;
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / max) * H;

  const toLine = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
      .join(" ");

  const primaryValues = data.map((d) => d.value);
  const areaPath = `${toLine(primaryValues)} L${x(n - 1).toFixed(2)},${H} L${x(0).toFixed(2)},${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height }}
      role="img"
    >
      <path d={areaPath} fill="currentColor" fillOpacity={0.14} className={primaryClass} />
      <path
        d={toLine(primaryValues)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        className={primaryClass}
      />
      {secondary && secondary.some((v) => v > 0) && (
        <path
          d={toLine(secondary)}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          className={secondaryClass}
        />
      )}
    </svg>
  );
}
