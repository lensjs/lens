import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const HEADER = "x-lens-request-id";

const randomId = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return (
    g.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
};

/**
 * Optional Next.js middleware that stamps a stable `x-lens-request-id` header so
 * `withLens()` can correlate a request across middleware and the Route Handler.
 *
 * Edge-safe: this module never imports `@lensjs/core`. Import it directly from
 * `@lensjs/nextjs/middleware` so the (Node-only) engine is not pulled into the
 * Edge middleware bundle.
 */
export function lensMiddleware() {
  return (request: NextRequest) => {
    const requestId = request.headers.get(HEADER) ?? randomId();
    const headers = new Headers(request.headers);
    headers.set(HEADER, requestId);
    return NextResponse.next({ request: { headers } });
  };
}
