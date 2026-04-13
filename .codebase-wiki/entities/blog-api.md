# blog-api

> REST API for blog post CRUD at `/api/posts`. D1-backed via Drizzle ORM. Content stored as Markdown with server-side reading time calculation.

## Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posts` | Public | List published posts (`?all=1` for admin to include drafts) |
| POST | `/api/posts` | Admin | Create a new post |
| GET | `/api/posts/{slug}` | Public | Get single published post by slug |
| PATCH | `/api/posts/{slug}` | Admin | Update post by slug |
| DELETE | `/api/posts/{slug}` | Admin | Delete post by slug |

## Source Files
- `src/app/api/posts/route.ts` — GET list and POST create handlers
- `src/app/api/posts/[slug]/route.ts` — GET single, PATCH update, DELETE handlers
- `src/lib/posts.ts` — Database queries, reading time calculation, markdown rendering

## Data Schema
Posts table: `slug` (PK), `title`, `excerpt`, `content` (Markdown), `coverImage`, `tags` (JSON array), `published` (boolean), `createdAt`, `updatedAt`, `readingTime`.

## Cross-References
- [[cloudflare-deployment]] — D1 database setup
- [[x402-monetization]] — Payment-gated external access