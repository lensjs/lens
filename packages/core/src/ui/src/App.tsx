import { Suspense, useEffect, useState } from "react";
import Router from "./router/Router";
import type { LensConfig } from "./types";
import { prepareApiUrl } from "./utils/api";
import ConfigContext from "./utils/context";
import LoadingScreen from "./components/layout/LoadingScreen";
import { GlobalLoader } from "./router/routes/Loading";
import { ThemeProvider } from "./utils/theme";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ErrorFallback } from "./components/common/ErrorFallback";
import LoginScreen from "./components/LoginScreen";
import { getToken, UNAUTHORIZED_EVENT } from "./utils/auth";

const App = () => {
  const [config, setConfig] = useState<LensConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean>(() => !!getToken());

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  useEffect(() => {
    fetch(prepareApiUrl("/lens-config"))
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load config (${res.status})`);
        }
        return res.json();
      })
      .then((cfg: unknown) => {
        setConfig(cfg as LensConfig);
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("Failed to load config:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load Lens configuration",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !config) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <ErrorFallback
            title="Could not load Lens"
            message={error ?? "Missing configuration"}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (config.authRequired && !authed) {
    return (
      <ThemeProvider>
        <LoginScreen
          loginUrl={config.api.login}
          appName={config.appName}
          onSuccess={() => setAuthed(true)}
        />
      </ThemeProvider>
    );
  }

  return (
    <ConfigContext.Provider value={{ config }}>
      <ThemeProvider>
        <ErrorBoundary>
          <Suspense fallback={<GlobalLoader />}>
            <Router config={config} />
          </Suspense>
        </ErrorBoundary>
      </ThemeProvider>
    </ConfigContext.Provider>
  );
};

export default App;
