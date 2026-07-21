import { Inbox } from "lucide-react";

export default function NoData({
  message = "No entries recorded yet",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-dim">
        <Inbox size={26} />
      </span>
      <p className="text-sm font-medium text-muted">{message}</p>
    </div>
  );
}
