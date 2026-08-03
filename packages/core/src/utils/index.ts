import { DateTime } from "luxon";
import { format, SqlLanguage } from "sql-formatter";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import * as path from "node:path";

export const generateRandomUuid = () => {
  return randomUUID();
};

type Bindings = any[] | Record<string, any>;

/**
 * Interpolates SQL query placeholders with actual values.
 * Supports:
 *   - ? (array-based)
 *   - $1, $name (numeric or named)
 *   - :name (named)
 */

export function interpolateQuery(query: string, bindings: any): string {
  // Convert any value into a safe SQL literal
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL";

    if (typeof value === "string") {
      return `'${value.replace(/'/g, "''")}'`; // escape single quotes
    }

    if (value instanceof DateTime) {
      return `'${value.toISO()}'`;
    }

    if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    }

    if (Array.isArray(value)) {
      return value.map((v) => formatValue(v)).join(", ");
    }

    if (typeof value === "object") {
      // Store objects as JSON text
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }

    return value.toString();
  };

  // Case 1: Array-based bindings.
  if (Array.isArray(bindings)) {
    // Positional '?' placeholders (mysql/sqlite style).
    if (query.includes("?")) {
      let i = 0;
      return query.replace(/\?/g, () => {
        if (i >= bindings.length) {
          throw new Error("Not enough bindings for placeholders");
        }
        return formatValue(bindings[i++]);
      });
    }

    // Positional '$1', '$2', ... placeholders (postgres style) backed by an
    // array — e.g. Sequelize/knex emit `$1` with an ordered bind array.
    return query.replace(/\$(\d+)/g, (match, index) => {
      const pos = Number(index) - 1;
      return pos >= 0 && pos < bindings.length
        ? formatValue(bindings[pos])
        : match;
    });
  }

  // Case 2: Object-based bindings ($1, $name, :name)
  return query.replace(/(\$|\:)(\w+)/g, (match, prefix, keyOrIndex) => {
    let value;

    if (prefix === "$" && /^\d+$/.test(keyOrIndex)) {
      // Numeric placeholder: $1, $2, ...
      const placeholder = `$${keyOrIndex}`;
      if (!(placeholder in bindings)) {
        throw new Error(`Missing binding for ${match}`);
      }
      value = bindings[placeholder];
    } else {
      // Named placeholder: $name or :name
      if (!(keyOrIndex in bindings)) {
        throw new Error(`Missing binding for ${match}`);
      }
      value = bindings[keyOrIndex];
    }

    return formatValue(value);
  });
}

export const formatSqlQuery = (query: string, language: SqlLanguage) => {
  return format(query, {
    language,
    dataTypeCase: "upper",
    keywordCase: "upper",
    functionCase: "upper",
  });
};

export function getMeta(metaUrl?: string): {
  __filename: string;
  __dirname: string;
} {
  const isESM = typeof __dirname === "undefined" || typeof __filename === "undefined";

  if (isESM) {
    if (!metaUrl) {
      throw new Error("In ESM, you must pass import.meta.url to getMeta()");
    }

    const __filename = fileURLToPath(metaUrl);
    const __dirname = path.dirname(__filename);
    return { __filename, __dirname };
  } else {
    return { __filename, __dirname };
  }
}

export function isStaticFile(params: string[]) {
  return params.includes("assets");
}

export function stripBeforeAssetsPath(url: string) {
  const match = url.match(/assets.*/);
  return match ? match[0] : url;
}

export function prepareIgnoredPaths(path: string, ignoredPaths: RegExp[]) {
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  ignoredPaths = [
    ...ignoredPaths,
    new RegExp(`^\/?${normalizedPath}(\/|$)`),
    /^\/?lens-config$/,
    /^\/?favicon\.ico$/,
    /^\/\.well-known\//,
  ];

  return { ignoredPaths, normalizedPath };
}
export function shouldIgnoreCurrentPath(
  path: string,
  ignoredPaths: RegExp[],
  onlyPaths: RegExp[],
) {
  if (onlyPaths.length > 0) {
    return !onlyPaths.some((pattern) => pattern.test(path));
  }

  return ignoredPaths.some((pattern) => pattern.test(path));
}

export function prettyHrTime(
  hrtime: [number, number],
  verbose = false,
): string {
  const seconds = hrtime[0];
  const nanoseconds = hrtime[1];
  const ms = seconds * 1000 + nanoseconds / 1e6;

  if (verbose) {
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    if (seconds >= 1) {
      return `${seconds}.${Math.floor(nanoseconds / 1e7)}s`;
    }
    return `${ms.toFixed(3)} ms`;
  }

  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  }

  return `${(ms / 1000).toFixed(1)} s`;
}

export function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Parse a human duration string produced by {@link prettyHrTime} (e.g. "9 ms",
 * "1.2 s") back into milliseconds. Tolerates a raw number and other units
 * (µs/ns/min). Returns 0 when unparseable.
 */
export function parseDurationMs(duration?: string | number | null): number {
  if (duration == null) return 0;
  if (typeof duration === "number") return duration;

  const match = String(duration)
    .trim()
    .match(/([\d.]+)\s*(ms|s|µs|us|ns|m|min)?/i);
  if (!match || !match[1]) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "ms").toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
    case "min":
      return value * 60_000;
    case "us":
    case "µs":
      return value / 1000;
    case "ns":
      return value / 1_000_000;
    default:
      return value;
  }
}

export * from "./compose";
