const BADGE =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ring-1 ring-inset";

// The HTTP method identifies LensJS UI affordance (not telemetry state), so it
// carries the brand violet uniformly; status codes stay semantically colored.
export default function RequestMethodBadge({ method }: { method: string }) {
  const normalized = method.toUpperCase();

  return (
    <span className={`${BADGE} bg-accent/10 text-accent ring-accent/25`}>
      {normalized}
    </span>
  );
}
