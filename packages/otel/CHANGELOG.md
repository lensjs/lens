# @lensjs/otel

## 0.1.1

### Patch Changes

- Updated dependencies [a72a324]
- Updated dependencies [a72a324]
- Updated dependencies [a72a324]
  - @lensjs/core@3.2.0

## 0.1.0

### Minor Changes

- baaf802: Add `@lensjs/otel`, an OpenTelemetry (OTLP) exporter that turns Lens's captured data into spans for Jaeger, Tempo, Grafana, Honeycomb, or any OTLP collector.
  - `createLensOtel({ endpoint, serviceName, headers })` registers a Lens trace sink and reconstructs spans from entries Lens already captures: a root SERVER span per request plus CLIENT/INTERNAL children for queries (`db.*`), outbound HTTP (`http.*`/`url.*`), cache, Redis, and exceptions — no second instrumentation layer in the app.
  - Span timings come from each entry's captured start time and duration, so the OTel waterfall matches the dashboard; attribute values are truncated and the payloads are the already-redacted ones Lens persists.
  - Speaks OTLP/HTTP JSON directly over `fetch` — no OpenTelemetry SDK dependency. `endpoint` and `serviceName` fall back to `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_SERVICE_NAME`, and `/v1/traces` is appended when absent.
  - Export is fire-and-forget after the response is sent: a slow or unreachable collector never blocks or throws into the host app. `shutdown()` unregisters the sink.

### Patch Changes

- Updated dependencies [39d9f80]
- Updated dependencies [39d9f80]
- Updated dependencies [3e5244b]
- Updated dependencies [4ba5a0c]
- Updated dependencies [4ba5a0c]
- Updated dependencies [68f0f5d]
- Updated dependencies [ad56591]
- Updated dependencies [14dab1b]
- Updated dependencies [39d9f80]
- Updated dependencies [a32f0e2]
- Updated dependencies [14dab1b]
- Updated dependencies [baaf802]
  - @lensjs/core@3.1.0
