import { lens } from "../../lens-instance";
import { emitLensJob } from "@lensjs/watchers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Wrapping the handler with `withLens` records the request/response and
// correlates any logs/jobs/exceptions emitted during it to this request.
export const GET = lens.withLens(async () => {
  console.info("Fetching users");

  // Enqueue a background job captured by the Jobs watcher (one row per job,
  // updated in place from "active" to "completed").
  const id = `emails:${rand(1000, 9999)}`;
  const shared = {
    id,
    name: "sendWelcomeEmail",
    queue: "emails",
    data: { to: "user@example.com" },
    createdAt: new Date().toISOString(),
  };
  emitLensJob({ ...shared, status: "active" });
  setTimeout(() => {
    emitLensJob({
      ...shared,
      status: "completed",
      attempts: 1,
      duration: `${rand(50, 900)} ms`,
      result: { messageId: `msg_${rand(100000, 999999)}` },
    });
  }, 1200);

  return Response.json({
    users: [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Doe" },
    ],
  });
});
