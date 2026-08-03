import { lens } from "../../lens-instance";

// The Lens engine + SQLite store need the Node runtime, and the SSE live tail
// must not be statically cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, POST, DELETE } = lens.handlers;
