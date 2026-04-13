# blog-api

> **Summary**: REST API for blog posts at `/api/posts`. Supports GET (list published, or all with `?all=1` for admins), POST (create), PATCH (update by slug), DELETE (remove by slug). Posts stored in Cloudflare D1 via Drizzle ORM. Content is Markdown; `readingTime` calculated server-side. Supports cover images and comma-separated tags.

## Location
- **Files**:
  - `src/app/api/posts/route.ts` — GET (list) and POST (create) handlers
  - `src/app/api/posts/[slug]/route.ts` — GET (single), PATCH (update), DELETE handlers
  - `src/lib/posts.ts` — Database queries, reading time calculation, markdown rendering

## Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts` | Public | List published posts (or all if `?all=1` + admin session) |
| POST | `/api/posts` | Admin | Create a new post |
| GET | `/api/posts/[slug]` | Public | Get single published post by slug |
| PATCH | `/api/posts/[slug]` | Admin | Update post by slug |
| DELETE | `/api/posts/[slug]` | Admin | Delete post by slug |

## Data Schema
Posts table (D1/SQLite): slug (PK), title, excerpt, content (Markdown), coverImage, tags (JSON array), published (boolean), createdAt, updatedAt, readingTime.

## See Also
- [[cloudflare-deployment]] — D1 database setup and Drizzle config
- [[x402-monetization]] — Payment-gated access for external consumers

## Evolution
- **2026-04-13** — Initial enrichment from source analysis

---
*Last updated: 2026-04-13*