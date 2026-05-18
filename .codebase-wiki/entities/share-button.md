# share-button

> **Summary**: Share button component and analytics endpoints for tracking shares. ShareButton uses Web Share API on mobile (native share sheet) with copy-to-clipboard fallback on desktop. POST /api/analytics/share increments page_shares table. GET /api/analytics/stats returns views+uniqueViews+shares for a path. Blog post page shows view count and share count. Uses warm gold theme hover styling.

## Location

- **Type**: module

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/components/share-button.tsx`
- `src/app/api/analytics/share/route.ts`
- `src/app/api/analytics/stats/route.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-05-18** — Initial creation

## See Also
- [[index]]
