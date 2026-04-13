# analytics-api

> **Summary**: Admin-only analytics endpoint at /api/analytics/views that reads page view data from D1 (page_views and page_referrers tables) and supplements with CF GraphQL zone-level totals. Also /api/analytics/track which records page views and referrers on every page load via client-side script. Supports 7/30/90 day ranges. Referrers are normalized to domain (strips www prefix, paths). Direct/bookmark visits stored as "direct".

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
- `src/app/api/analytics/track/route.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-13** — Initial creation

## See Also
- [[index]]
