# blog-api

> **Summary**: REST API for blog posts at /api/posts. GET returns published posts (or all with ?all=1 for admins). POST creates, PATCH updates, DELETE removes. Posts stored in Cloudflare D1 via Drizzle ORM. Content is Markdown; readingTime calculated server-side. Supports cover images and tags.

## Location

- **Type**: module

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/app/api/posts/route.ts`
- `src/app/api/posts/[slug]/route.ts`
- `src/lib/posts.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-13** — Initial creation

## See Also
- [[index]]
