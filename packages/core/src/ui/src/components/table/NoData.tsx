import { LensMark } from "../LensMark";

export default function NoData({
  message = "No entries recorded yet",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <LensMark size={40} className="rounded-xl opacity-90" />
      <p className="text-sm font-medium text-muted">{message}</p>
    </div>
  );
}
