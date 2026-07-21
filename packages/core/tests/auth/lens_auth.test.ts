import { describe, it, expect } from "vitest";
import { createLensAuth } from "../../src/auth/lens_auth";

describe("createLensAuth", () => {
  it("is disabled when no password is configured", () => {
    const auth = createLensAuth();
    expect(auth.enabled).toBe(false);
    expect(auth.attemptLogin("1.1.1.1", "anything").ok).toBe(false);
    expect(auth.authorize("Bearer whatever")).toBe(false);
  });

  it("issues a token for the correct password and authorizes it", () => {
    const auth = createLensAuth({ password: "s3cret" });
    expect(auth.enabled).toBe(true);

    const result = auth.attemptLogin("1.1.1.1", "s3cret");
    expect(result.ok).toBe(true);
    expect(typeof result.token).toBe("string");
    expect(auth.authorize(`Bearer ${result.token}`)).toBe(true);
    // Also accepts a bare token (no Bearer prefix).
    expect(auth.authorize(result.token!)).toBe(true);
  });

  it("rejects the wrong password without issuing a token", () => {
    const auth = createLensAuth({ password: "s3cret" });
    const result = auth.attemptLogin("1.1.1.1", "wrong");
    expect(result.ok).toBe(false);
    expect(result.token).toBeUndefined();
  });

  it("rejects tampered and malformed tokens", () => {
    const auth = createLensAuth({ password: "s3cret" });
    const { token } = auth.attemptLogin("1.1.1.1", "s3cret");

    expect(auth.authorize(`Bearer ${token}x`)).toBe(false);
    expect(auth.authorize("Bearer not.a.token")).toBe(false);
    expect(auth.authorize("Bearer ")).toBe(false);
    expect(auth.authorize(undefined)).toBe(false);
    expect(auth.authorize(null)).toBe(false);
  });

  it("does not authorize an expired token", () => {
    const auth = createLensAuth({ password: "s3cret", tokenTtl: -10 });
    const { ok, token } = auth.attemptLogin("1.1.1.1", "s3cret");
    expect(ok).toBe(true);
    expect(auth.authorize(`Bearer ${token}`)).toBe(false);
  });

  it("does not accept a token signed with a different password", () => {
    const a = createLensAuth({ password: "one" });
    const b = createLensAuth({ password: "two" });
    const { token } = a.attemptLogin("1.1.1.1", "one");
    expect(b.authorize(`Bearer ${token}`)).toBe(false);
  });

  it("rate-limits and locks out repeated failures per IP", () => {
    const auth = createLensAuth({
      password: "s3cret",
      maxAttempts: 3,
      lockoutMs: 60_000,
    });
    const ip = "9.9.9.9";

    // First (maxAttempts) failures are allowed through and rejected normally.
    expect(auth.attemptLogin(ip, "x").retryAfter).toBeUndefined();
    expect(auth.attemptLogin(ip, "x").retryAfter).toBeUndefined();
    expect(auth.attemptLogin(ip, "x").retryAfter).toBeUndefined();

    // Now locked out — even the correct password is blocked with a retryAfter.
    const blocked = auth.attemptLogin(ip, "s3cret");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    // A different IP is unaffected.
    expect(auth.attemptLogin("8.8.8.8", "s3cret").ok).toBe(true);
  });

  it("resets the limiter after a successful login", () => {
    const auth = createLensAuth({ password: "s3cret", maxAttempts: 3 });
    const ip = "7.7.7.7";

    auth.attemptLogin(ip, "x");
    auth.attemptLogin(ip, "x");
    expect(auth.attemptLogin(ip, "s3cret").ok).toBe(true);

    // Counter cleared: two fresh failures still don't lock out.
    expect(auth.attemptLogin(ip, "x").retryAfter).toBeUndefined();
    expect(auth.attemptLogin(ip, "x").retryAfter).toBeUndefined();
  });
});
