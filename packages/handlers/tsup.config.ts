import { defineConfig, Options } from "tsup";
import { baseConfig } from "../../tsup.config";

const config = {
    ...baseConfig
} as Options

export default defineConfig(config);
