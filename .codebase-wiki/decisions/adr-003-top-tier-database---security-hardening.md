# ADR-003: Top-Tier Database & Security Hardening

> **Status**: Accepted

## Context
The moikapy.dev blog on Cloudflare D1 + Workers needed production-grade hardening across three tiers: database performance, security, and query optimization. Issues included missing indexes on analytics tables, JSON tags column with no queryability, duplicate DB connection logic, no rate limiting, no input validation on admin APIs, spoofable x402 origin checks, no security headers, no D1 write batching, no caching, and no data retention.

## Decision
Implemented all three tiers: (1) Database: added 6 indexes on page_views/page_referrers/reactions, created post_tags junction table to normalize tags, deduplicated getDb() into src/db/connection.ts. (2) Security: added IP-based rate limiting (src/lib/rate-limit.ts) on reactions and analytics endpoints, input validation/sanitization module (src/lib/sanitize.ts) applied to all post creation/update endpoints, fixed x402-lite isSiteInternalRequest to properly validate origin/referer with URL parsing (removed insecure cookie check), added security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) to middleware. (3) Optimization: added unstable_cache for published posts and tags (5min revalidation), D1 batch writes for analytics tracking, query length limits on knowledge API, data retention module + admin prune endpoint.

## Consequences
- (to be determined)

## Alternatives Considered
Could have used Cloudflare Rate Limiting rules instead of in-memory rate limiting, but that requires paid plan. Could have used SQLite FTS5 for knowledge search instead of JS-based string matching, but current approach is adequate for blog scale.

## References
- Created: 2026-04-14

## See Also
- [[index]]
