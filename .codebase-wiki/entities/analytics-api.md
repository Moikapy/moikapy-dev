# analytics-api

> **Summary**: Admin-only analytics endpoint at `/api/analytics/views` that queries the Cloudflare GraphQL Analytics API for zone-level page view and request data. Returns per-post blog views, top paths, and totals. Supports configurable time ranges (7/30/90 days). Falls back gracefully with debug messages when CF_API_TOKEN or CF_ZONE_ID are missing or misconfigured.

## Location

- **Type**: service

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/app/api/analytics/views/route.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-13** — Initial creation

## See Also
- [[index]]
