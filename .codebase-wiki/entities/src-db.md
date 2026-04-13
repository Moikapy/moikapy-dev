# src-db

> **Summary**: Database layer using Drizzle ORM with D1 (SQLite). Schema includes: posts (slug, title, content, tags as JSON, published flag), reactions (emoji reactions per post by visitor hash), page_views (path+date composite key, view counts), page_referrers (referer domain+path+date, view counts). Migrations in drizzle/ directory. See [[analytics-api]] for how page_views and page_referrers are used.

## Location

- **Type**: module

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/db/schema.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-13** — Initial creation

## See Also
- [[index]]
