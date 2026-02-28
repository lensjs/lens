export default function RequestMethodBadge({ method }: { method: string }) {
  let color = "bg-slate-500/10 text-slate-400 border-slate-500/20";

  switch (method.toUpperCase()) {
    case "GET":
      color = "bg-sky-500/10 text-sky-400 border-sky-500/20";
      break;
    case "POST":
      color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      break;
    case "PUT":
    case "PATCH":
      color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
      break;
    case "DELETE":
      color = "bg-rose-500/10 text-rose-400 border-rose-500/20";
      break;
  }

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-bold border tracking-wider ${color}`}>
      {method.toUpperCase()}
    </span>
  );
}
