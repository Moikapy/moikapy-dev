# cloudflare-deployment

> **Summary**: Deploys as a Cloudflare Worker via OpenNext with D1 (SQLite) for storage. Secrets managed through wrangler secret: ADMIN_PASSWORD_HASH, SESSION_SECRET, OLLAMA_API_KEY, ELEVENLABS_API_KEY, CF_API_TOKEN, CF_ZONE_ID. Static assets via Workers Sites. D1 tables: posts, reactions, page_views (analytics), page_referrers (referrer tracking). See [[analytics-api]] for analytics secrets, [[src-db]] for schema.

## Location

- **Type**: module

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `wrangler.toml`
- `next.config.ts`
- `open-next.config.ts`
- `drizzle.config.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-13** — Initial creation

## See Also
- [[index]]
