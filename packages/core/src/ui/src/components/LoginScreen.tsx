import { useState, type FormEvent } from "react";
import { Lock, LoaderCircle } from "lucide-react";
import { prepareApiUrl } from "../utils/api";
import { setToken } from "../utils/auth";
import { LensLogo } from "./LensLogo";

interface LoginScreenProps {
  loginUrl: string;
  appName: string;
  onSuccess: () => void;
}

const LoginScreen = ({ loginUrl, appName, onSuccess }: LoginScreenProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(prepareApiUrl(loginUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const body = await res.json().catch(() => null);
        const token = body?.data?.token as string | undefined;
        if (token) {
          setToken(token);
          onSuccess();
          return;
        }
        setError("Unexpected response. Please try again.");
      } else if (res.status === 429) {
        const retry = res.headers.get("Retry-After");
        setError(
          retry
            ? `Too many attempts. Try again in ${retry}s.`
            : "Too many attempts. Please try again later.",
        );
      } else {
        setError("Invalid password.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-panel w-full max-w-sm space-y-6 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LensLogo size={40} className="text-accent" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-fg">
              {appName}
            </h1>
            <p className="text-sm text-muted">
              Enter the password to unlock the dashboard
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="lens-password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim"
            />
            <input
              id="lens-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-border bg-surface-2/60 py-2 pl-9 pr-3 text-sm text-fg outline-none transition-colors focus:border-accent"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Lock size={16} />
          )}
          {loading ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
