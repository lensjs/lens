import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { LensAuthConfig } from "../types/index";

const TOKEN_VERSION = "v1";
const KEY_INFO = "lensjs:auth:v1";
const MAX_PASSWORD_LENGTH = 1024; // guard against hashing attacker-sized input
const MAX_TRACKED_IPS = 10_000; // cap the rate-limiter map (memory DoS guard)

const DEFAULTS = {
  tokenTtl: 12 * 60 * 60, // seconds (12h)
  maxAttempts: 5,
  windowMs: 60_000,
  lockoutMs: 60_000,
  maxLockoutMs: 60 * 60 * 1000, // cap exponential lockout at 1h
};

export interface LensAuth {
  readonly enabled: boolean;
  /** Verify a login attempt for the given client IP (rate-limited). */
  attemptLogin(
    ip: string,
    password: unknown,
  ): { ok: boolean; token?: string; expiresIn?: number; retryAfter?: number };
  /** Verify an `Authorization` header value. */
  authorize(authorizationHeader?: string | string[] | null): boolean;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input as any).toString("base64url");
}

/**
 * Create the dashboard auth service. Framework-agnostic: adapters wire the HTTP
 * parts (reading the body/IP/Authorization header and setting status codes).
 *
 * Security:
 * - Passwords are compared in constant time over fixed-length digests.
 * - Tokens are stateless, HMAC-SHA256 signed and expiry-checked.
 * - Login is rate-limited per IP with exponential lockout.
 */
export function createLensAuth(config?: LensAuthConfig): LensAuth {
  const password = config?.password;

  if (!password) {
    return {
      enabled: false,
      attemptLogin: () => ({ ok: false }),
      authorize: () => false,
    };
  }

  const tokenTtl = config?.tokenTtl ?? DEFAULTS.tokenTtl;
  const maxAttempts = config?.maxAttempts ?? DEFAULTS.maxAttempts;
  const windowMs = config?.windowMs ?? DEFAULTS.windowMs;
  const baseLockoutMs = config?.lockoutMs ?? DEFAULTS.lockoutMs;

  // Signing key derived from the secret (or the password). Changing the
  // password therefore invalidates previously issued tokens.
  const signingKey = createHmac("sha256", config?.secret ?? password)
    .update(KEY_INFO)
    .digest();
  const passwordDigest = sha256(password);

  function signToken(ttlSeconds: number): string {
    const payload = toBase64Url(
      JSON.stringify({ exp: Date.now() + ttlSeconds * 1000 }),
    );
    const signingInput = `${TOKEN_VERSION}.${payload}`;
    const signature = toBase64Url(
      createHmac("sha256", signingKey).update(signingInput).digest(),
    );
    return `${signingInput}.${signature}`;
  }

  function verifyToken(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return false;

      const [, payload, signature] = parts as [string, string, string];
      const expected = createHmac("sha256", signingKey)
        .update(`${TOKEN_VERSION}.${payload}`)
        .digest();
      const provided = Buffer.from(signature, "base64url");

      if (
        provided.length !== expected.length ||
        !timingSafeEqual(provided, expected)
      ) {
        return false;
      }

      const decoded = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      ) as { exp?: number };

      return typeof decoded.exp === "number" && decoded.exp > Date.now();
    } catch {
      return false;
    }
  }

  function verifyPassword(candidate: unknown): boolean {
    if (typeof candidate !== "string" || candidate.length > MAX_PASSWORD_LENGTH) {
      return false;
    }
    return timingSafeEqual(sha256(candidate), passwordDigest);
  }

  // --- Rate limiter (in-memory, per IP) ---
  type Bucket = {
    fails: number;
    windowStart: number;
    blockedUntil: number;
    lockoutMs: number;
  };
  const buckets = new Map<string, Bucket>();

  function pruneIfNeeded(now: number) {
    if (buckets.size <= MAX_TRACKED_IPS) return;
    for (const [ip, b] of buckets) {
      if (b.blockedUntil <= now && now - b.windowStart > windowMs) {
        buckets.delete(ip);
      }
    }
  }

  function consume(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const bucket = buckets.get(ip);

    if (!bucket) return { allowed: true };

    if (bucket.blockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000) };
    }

    if (now - bucket.windowStart > windowMs) {
      bucket.fails = 0;
      bucket.windowStart = now;
    }

    return { allowed: true };
  }

  function recordFailure(ip: string) {
    const now = Date.now();
    pruneIfNeeded(now);
    const bucket = buckets.get(ip) ?? {
      fails: 0,
      windowStart: now,
      blockedUntil: 0,
      lockoutMs: baseLockoutMs,
    };

    bucket.fails += 1;

    if (bucket.fails >= maxAttempts) {
      bucket.blockedUntil = now + bucket.lockoutMs;
      bucket.lockoutMs = Math.min(bucket.lockoutMs * 2, DEFAULTS.maxLockoutMs);
      bucket.fails = 0;
      bucket.windowStart = now;
    }

    buckets.set(ip, bucket);
  }

  return {
    enabled: true,

    attemptLogin(ip, candidate) {
      const key = ip || "unknown";
      const gate = consume(key);
      if (!gate.allowed) {
        return { ok: false, retryAfter: gate.retryAfter };
      }

      if (verifyPassword(candidate)) {
        buckets.delete(key); // reset on success
        return { ok: true, token: signToken(tokenTtl), expiresIn: tokenTtl };
      }

      recordFailure(key);
      return { ok: false };
    },

    authorize(authorizationHeader) {
      const header = Array.isArray(authorizationHeader)
        ? authorizationHeader[0]
        : authorizationHeader;
      if (!header || typeof header !== "string") return false;

      const token = header.startsWith("Bearer ") ? header.slice(7) : header;
      return verifyToken(token.trim());
    },
  };
}
