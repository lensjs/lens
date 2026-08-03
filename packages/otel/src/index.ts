import { setLensTraceSink, type LensTrace } from "@lensjs/core";
import { buildResourceSpans } from "./spans";

export type LensOtelConfig = {
  /**
   * OTLP/HTTP endpoint. A base URL gets `/v1/traces` appended. Defaults to
   * `OTEL_EXPORTER_OTLP_ENDPOINT`, then `http://localhost:4318`.
   */
  endpoint?: string;
  /** `service.name` resource attribute. Defaults to `OTEL_SERVICE_NAME`, then `"lens"`. */
  serviceName?: string;
  /** Extra headers for the OTLP request (e.g. vendor auth). */
  headers?: Record<string, string>;
};

export type LensOtel = {
  /** Stop exporting (unregisters the trace sink). */
  shutdown: () => void;
};

function resolveTracesUrl(base: string): string {
  return /\/v1\/traces\/?$/.test(base)
    ? base
    : `${base.replace(/\/+$/, "")}/v1/traces`;
}

/**
 * Export Lens's captured requests — and the queries, HTTP calls, cache
 * operations and exceptions correlated to them — as OpenTelemetry spans over
 * OTLP/HTTP. Call once at startup, after `lens(...)`.
 *
 * Registering the sink is what enables trace collection. Incoming `traceparent`
 * headers are honored (so Lens joins an existing distributed trace) and, when
 * `instrumentFetch()` is installed, outbound calls carry the trace onward.
 *
 * ```ts
 * createLensOtel({ endpoint: "http://localhost:4318", serviceName: "api" });
 * ```
 */
export function createLensOtel(config: LensOtelConfig = {}): LensOtel {
  const base =
    config.endpoint ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    "http://localhost:4318";
  const url = resolveTracesUrl(base);
  const serviceName =
    config.serviceName ?? process.env.OTEL_SERVICE_NAME ?? "lens";

  const exportTrace = async (trace: LensTrace): Promise<void> => {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...config.headers },
        body: JSON.stringify(buildResourceSpans(trace, serviceName)),
      });
    } catch (err) {
      console.error("Lens: OTLP trace export failed", err);
    }
  };

  setLensTraceSink((trace) => {
    // Fire-and-forget: exporting must never block the host app.
    void exportTrace(trace);
  });

  return {
    shutdown: () => setLensTraceSink(null),
  };
}

export { buildResourceSpans } from "./spans";
