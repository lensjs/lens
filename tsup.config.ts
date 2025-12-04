import { type Options } from "tsup";
export type TSUPOptions = Options;
export const baseConfig: TSUPOptions = {
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
};
