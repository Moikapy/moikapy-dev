# ADR-002: Use D1 page_views table instead of CF path-level analytics

> **Status**: Accepted

## Context
CF free plan doesn't support path-level analytics (clientRequestPath dimension requires Business plan). Need per-page view counts for the admin analytics dashboard.

## Decision
Use D1 SQLite table (page_views) with composite key (path, date) to track page views. Client-side script fires POST /api/analytics/track on each page load. D1 upsert is atomic and fast. CF GraphQL API still used for aggregate zone-level totals when available. Path-level data comes entirely from D1.

## Consequences
- (to be determined)

## Alternatives Considered
CF Business plan (paid), Cloudflare Analytics Engine (complex setup), client-side CF beacon (no API for per-path data).

## References
- Created: 2026-04-13

## See Also
- [[index]]
