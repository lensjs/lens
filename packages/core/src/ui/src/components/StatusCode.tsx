const getColorClass = (status: number) => {
  if (status >= 200 && status < 300) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (status >= 300 && status < 400) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (status >= 400 && status < 500) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (status >= 500) return "bg-red-500/20 text-red-400 border-red-500/30";

  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

export const StatusCode = ({ status }: { status: number }) => {
  return (
    <span
      className={`rounded-md px-2.5 py-1 text-sm font-bold border ${getColorClass(status)}`}
    >
      {status}
    </span>
  );
};

export default StatusCode;
