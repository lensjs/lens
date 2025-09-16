import { defineConfig, type Options } from "tsup";
import { baseConfig } from "../../tsup.config.js";

const config = {
  ...baseConfig,
  entry: ["lib/**/*.ts"],
  format: ["esm"],
} as Options;

export default defineConfig(config);
