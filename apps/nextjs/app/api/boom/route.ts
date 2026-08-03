import { lens } from "../../lens-instance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Intentionally throws — captured by the exception watcher and recorded as a
// 500 request, both correlated to this request.
export const GET = lens.withLens(async () => {
  throw new Error("Intentional demo exception from /api/boom");
});
