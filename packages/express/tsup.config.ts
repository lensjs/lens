import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  bundle: true,
  target: "node18",
  splitting: false,
  clean: true,
  shims: true,
  skipNodeModulesBundle: true,
});

