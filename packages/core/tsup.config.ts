import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/ui/**/*"],
  outDir: "dist",
  format: ["esm", "cjs"],
  dts: true,
  bundle: true,
  target: "node18",
  splitting: false,
  clean: true,
  shims: false,
  // shims: true,
  skipNodeModulesBundle: true,
});
