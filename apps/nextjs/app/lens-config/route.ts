import { lens } from "../lens-instance";

// The dashboard bootstraps by fetching `/lens-config` from the origin root, so
// it is mounted separately from the `/lens` catch-all.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET } = lens.handlers;
