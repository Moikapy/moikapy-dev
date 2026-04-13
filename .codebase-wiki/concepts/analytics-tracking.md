# analytics-tracking

> **Summary**: D1-based page view and referrer tracking system. Client-side script in layout.tsx fires POST /api/analytics/track with path and referrer on each page load. Data stored in page_views (path, date, views) and page_referrers (referer, path, date, views) tables. Referrers normalized to domain (strips www prefix and paths; "direct" for no referrer). Admin analytics dashboard reads from D1 for per-path data, supplemented by CF GraphQL API for aggregate zone totals. See [[analytics-api]] and [[admin-panel]].

## Applies To
- [[analytics-api]]
- [[admin-panel]]
- [[src-db]]
- [[cloudflare-deployment]]

## Description
(to be expanded through analysis)

## Key Characteristics
- (to be discovered)

## See Also
- [[index]]

---
*Created: 2026-04-13*