import type { ApiResponse, PaginatorMeta } from "../types";
import { clearToken, getToken, UNAUTHORIZED_EVENT } from "./auth";

/**
 * Shared HTTP helpers for the Lens dashboard.
 *
 * Kept as stable module-level functions (not hooks) so they can be reused by
 * both the imperative `useLensApi` layer and the React Query hooks without
 * duplicating fetch/query-string/meta logic.
 */

export const DEFAULT_META: PaginatorMeta = {
  nextCursor: null,
  headCursor: null,
  hasMore: false,
  perPage: 100,
};

export async function fetchJson<TData>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<TData>> {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options?.headers as Record<string, string> | undefined) ?? {}),
    },
  });

  // Token missing/expired: drop it and let the app fall back to the login screen.
  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url}`);
  }

  return res.json();
}

export function withQueryParams(
  endpoint: string,
  params?: Record<string, unknown>,
): string {
  const searchParams = new URLSearchParams(
    Object.entries(params || {}).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  return `${endpoint}${searchParams.toString() ? `?${searchParams}` : ""}`;
}
