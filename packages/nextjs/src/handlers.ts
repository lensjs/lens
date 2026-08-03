import type { NextAdapter } from "./adapter";
import type { LensNextHandlers } from "./types";

/**
 * Build the Next.js Route Handlers (GET/POST/DELETE) that serve the dashboard,
 * the Lens API, and the SSE live tail. Re-export these from your catch-all
 * `app/<path>/[[...lensjs]]/route.ts` and from `app/lens-config/route.ts`.
 */
export function buildRouteHandlers(adapter: NextAdapter): LensNextHandlers {
  const handle = async (request: Request): Promise<Response> => {
    const response = await adapter.dispatch(request);
    return response ?? new Response("Not Found", { status: 404 });
  };

  return { GET: handle, POST: handle, DELETE: handle };
}
