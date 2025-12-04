import { createContext, useContext } from "react";
import type { LensConfig } from "../types";

interface ConfigContextType {
  config: LensConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used inside a ConfigProvider");
  }
  return context.config;
}

export function getBasePath() {
  const config = useConfig();

  return config.path;
}

export default ConfigContext;
