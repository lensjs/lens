import type { JobStatus } from "../types";

const JobStatusBadge = ({ status }: { status: JobStatus }) => {
  const colors: Record<JobStatus, string> = {
    active: "bg-info/10 text-info ring-info/20",
    completed: "bg-success/10 text-success ring-success/20",
    failed: "bg-danger/10 text-danger ring-danger/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${
        colors[status] || colors.active
      }`}
    >
      {status}
    </span>
  );
};

export default JobStatusBadge;
