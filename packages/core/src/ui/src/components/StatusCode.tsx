const getColorClass = (status: number) => {
  if (status >= 200 && status < 300)
    return "bg-success/10 text-success ring-success/20";
  if (status >= 300 && status < 400)
    return "bg-info/10 text-info ring-info/20";
  if (status >= 400 && status < 500)
    return "bg-warning/10 text-warning ring-warning/20";
  if (status >= 500) return "bg-danger/10 text-danger ring-danger/20";

  return "bg-surface-2 text-muted ring-border";
};

export const StatusCode = ({ status }: { status: number }) => {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular ring-1 ring-inset ${getColorClass(status)}`}
    >
      {status}
    </span>
  );
};

export default StatusCode;
