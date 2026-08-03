import { lensMiddleware } from "@lensjs/nextjs/middleware";

// Optional: stamps a stable `x-lens-request-id` header so `withLens` can
// correlate the request. Imported from the Edge-safe `/middleware` subpath.
export const middleware = lensMiddleware();

export const config = {
  matcher: ["/api/:path*"],
};
