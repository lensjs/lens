/**
 * Dashboard auth token storage. The token is a stateless HMAC issued by the
 * login endpoint and sent as `Authorization: Bearer <token>` on API requests.
 */

const TOKEN_KEY = "lens:token";

/** Fired when an API request is rejected with 401 (token missing/expired). */
export const UNAUTHORIZED_EVENT = "lens:unauthorized";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (e.g. private mode) — token just won't persist
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
