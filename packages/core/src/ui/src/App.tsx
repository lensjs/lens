import { Suspense, useEffect, useState } from "react";
import Router from "./router/Router";
import type { LensConfig } from "./types";
import { prepareApiUrl } from "./utils/api";
import ConfigContext from "./utils/context";
import LoadingScreen from "./components/layout/LoadingScreen";
import { GlobalLoader } from "./router/routes/Loading";

const App = () => {
  const [config, setConfig] = useState<LensConfig>({} as LensConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(prepareApiUrl("/lens-config"))
      .then((res) => res.json())
      .then((cfg: unknown) => {
        setConfig(cfg as LensConfig);
      })
      .catch((err) => {
        console.error("Failed to load config:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ConfigContext.Provider value={{ config: config }}>
      <Suspense fallback={<GlobalLoader />}>
        <Router config={config} />
      </Suspense>
    </ConfigContext.Provider>
  );
};

export default App;
