---
"@lensjs/otel": minor
---

Add `@lensjs/otel`, an OpenTelemetry (OTLP) exporter that turns Lens's captured data into spans for Jaeger, Tempo, Grafana, Honeycomb, or any OTLP collector.

- `createLensOtel({ endpoint, serviceName, headers })` registers a Lens trace sink and reconstructs spans from entries Lens already captures: a root SERVER span per request plus CLIENT/INTERNAL children for queries (`db.*`), outbound HTTP (`http.*`/`url.*`), cache, Redis, and exceptions — no second instrumentation layer in the app.
- Span timings come from each entry's captured start time and duration, so the OTel waterfall matches the dashboard; attribute values are truncated and the payloads are the already-redacted ones Lens persists.
- Speaks OTLP/HTTP JSON directly over `fetch` — no OpenTelemetry SDK dependency. `endpoint` and `serviceName` fall back to `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_SERVICE_NAME`, and `/v1/traces` is appended when absent.
- Export is fire-and-forget after the response is sent: a slow or unreachable collector never blocks or throws into the host app. `shutdown()` unregisters the sink.
