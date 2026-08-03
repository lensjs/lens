import type { LensConfig } from "../types/index.ts";

const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

const isPositiveNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate the neutral Lens configuration at boot and throw a single aggregated,
 * actionable error listing every problem found. Only the shared `LensConfig`
 * surface is checked; framework-specific fields (`app`, `queryWatcher`,
 * `isAuthenticated`, ...) are ignored, and every field is optional.
 */
export function assertValidConfig(
  config: (Partial<LensConfig> & Record<string, any>) | undefined,
): void {
  const errors: string[] = [];
  const cfg = (config ?? {}) as Record<string, any>;

  if (
    cfg.path !== undefined &&
    (typeof cfg.path !== "string" || cfg.path.trim() === "")
  ) {
    errors.push('`path` must be a non-empty string (e.g. "/lens").');
  }
  if (cfg.appName !== undefined && typeof cfg.appName !== "string") {
    errors.push("`appName` must be a string.");
  }
  if (cfg.enabled !== undefined && typeof cfg.enabled !== "boolean") {
    errors.push("`enabled` must be a boolean.");
  }

  if (cfg.hiddenParams !== undefined) {
    if (!isPlainObject(cfg.hiddenParams)) {
      errors.push("`hiddenParams` must be an object.");
    } else {
      if (
        cfg.hiddenParams.headers !== undefined &&
        !isStringArray(cfg.hiddenParams.headers)
      ) {
        errors.push("`hiddenParams.headers` must be an array of strings.");
      }
      if (
        cfg.hiddenParams.bodyParams !== undefined &&
        !isStringArray(cfg.hiddenParams.bodyParams)
      ) {
        errors.push("`hiddenParams.bodyParams` must be an array of strings.");
      }
    }
  }

  if (cfg.storeQueueConfig !== undefined) {
    if (!isPlainObject(cfg.storeQueueConfig)) {
      errors.push("`storeQueueConfig` must be an object.");
    } else {
      const sq = cfg.storeQueueConfig;
      for (const key of [
        "batchSize",
        "processIntervalMs",
        "warnThreshold",
        "dbMaxSizeGb",
        "dbPruneSizeGb",
      ]) {
        if (sq[key] !== undefined && !isPositiveNumber(sq[key])) {
          errors.push(`\`storeQueueConfig.${key}\` must be a positive number.`);
        }
      }
      if (sq.databasePath !== undefined && typeof sq.databasePath !== "string") {
        errors.push("`storeQueueConfig.databasePath` must be a string.");
      }
      if (sq.readonly !== undefined && typeof sq.readonly !== "boolean") {
        errors.push("`storeQueueConfig.readonly` must be a boolean.");
      }
      validateRetention(sq.retention, errors);
    }
  }

  validateSampling(cfg.sampling, errors);

  if (cfg.alerts !== undefined) {
    if (!isPlainObject(cfg.alerts)) {
      errors.push("`alerts` must be an object.");
    } else {
      const a = cfg.alerts;
      if (typeof a.webhookUrl !== "string" || !isValidUrl(a.webhookUrl)) {
        errors.push("`alerts.webhookUrl` must be a valid URL string.");
      }
      if (
        a.provider !== undefined &&
        !["slack", "discord", "webhook"].includes(a.provider)
      ) {
        errors.push(
          '`alerts.provider` must be one of "slack", "discord", "webhook".',
        );
      }
      if (a.cooldownMs !== undefined && !isPositiveNumber(a.cooldownMs)) {
        errors.push("`alerts.cooldownMs` must be a positive number.");
      }
      if (
        a.everyOccurrence !== undefined &&
        typeof a.everyOccurrence !== "boolean"
      ) {
        errors.push("`alerts.everyOccurrence` must be a boolean.");
      }
      if (
        a.dashboardUrl !== undefined &&
        (typeof a.dashboardUrl !== "string" || !isValidUrl(a.dashboardUrl))
      ) {
        errors.push("`alerts.dashboardUrl` must be a valid URL string.");
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid Lens configuration:\n${errors
        .map((e) => `  - ${e}`)
        .join("\n")}`,
    );
  }
}

function validateSampling(sampling: unknown, errors: string[]): void {
  if (sampling === undefined) return;
  if (!isPlainObject(sampling)) {
    errors.push("`sampling` must be an object.");
    return;
  }
  if (
    sampling.rate !== undefined &&
    (typeof sampling.rate !== "number" ||
      !Number.isFinite(sampling.rate) ||
      sampling.rate < 0 ||
      sampling.rate > 1)
  ) {
    errors.push("`sampling.rate` must be a number between 0 and 1.");
  }
  if (
    sampling.alwaysOnErrors !== undefined &&
    typeof sampling.alwaysOnErrors !== "boolean"
  ) {
    errors.push("`sampling.alwaysOnErrors` must be a boolean.");
  }
  if (
    sampling.alwaysOnSlowMs !== undefined &&
    !isPositiveNumber(sampling.alwaysOnSlowMs)
  ) {
    errors.push("`sampling.alwaysOnSlowMs` must be a positive number.");
  }
}

function validateRetention(retention: unknown, errors: string[]): void {
  if (retention === undefined) return;
  if (!isPlainObject(retention)) {
    errors.push("`storeQueueConfig.retention` must be an object.");
    return;
  }
  if (
    retention.defaultMaxAgeMs !== undefined &&
    !isPositiveNumber(retention.defaultMaxAgeMs)
  ) {
    errors.push(
      "`storeQueueConfig.retention.defaultMaxAgeMs` must be a positive number.",
    );
  }
  if (
    retention.sweepIntervalMs !== undefined &&
    !isPositiveNumber(retention.sweepIntervalMs)
  ) {
    errors.push(
      "`storeQueueConfig.retention.sweepIntervalMs` must be a positive number.",
    );
  }
  if (retention.perType !== undefined) {
    if (!isPlainObject(retention.perType)) {
      errors.push("`storeQueueConfig.retention.perType` must be an object.");
    } else {
      for (const [k, v] of Object.entries(retention.perType)) {
        if (!isPositiveNumber(v)) {
          errors.push(
            `\`storeQueueConfig.retention.perType.${k}\` must be a positive number.`,
          );
        }
      }
    }
  }
}
