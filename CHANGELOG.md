# Changelog

## 1.0.0 — 2026-11-19

- First release: a typed client for every GET route of the Satelit data API `/v1` (105 methods, types generated from the OpenAPI document).
- `{ data, meta, rate }` from every call; `lastMeta` and `lastRate` on the client.
- `SatelitError` with `status`, `code`, `message`, `docs`, `fields`, `retryAfter`, `choose`, `rate`.
- 10 s timeout per attempt; retries of 429 `rate_limited` and 503 with `Retry-After` only, at most 3.
- `paginate()` over `meta.page`, `feed.iterate()` over `meta.next`, `export.rows()` and `export.stream()` for NDJSON exports.
- ES modules and CommonJS builds with `.d.ts`; zero runtime dependencies.
