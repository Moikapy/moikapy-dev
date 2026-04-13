# ADR-001: Cloudflare Workers + D1 over Vercel + Postgres

> **Status**: Accepted
> **Date**: 2026-04-13

## Context

Need a hosting platform for a personal blog with server-side API routes, database, and edge performance. The blog serves static pages with some dynamic admin routes and API endpoints.

## Decision

Deploy on Cloudflare Workers using OpenNext (opennextjs-cloudflare) with D1 (SQLite) as the database.

- D1 is free tier friendly, globally distributed, and pairs naturally with Workers
- Uses Drizzle ORM for type-safe queries
- Secrets managed via `wrangler secret` (ADMIN_PASSWORD_HASH, SESSION_SECRET, OLLAMA_API_KEY, ELEVENLABS_API_KEY)
- Static assets served from Workers Sites via OpenNext
- wrangler.toml defines bindings for DB and WORKER_SELF_REFERENCE

## Alternatives Considered

- **Vercel + PlanetScale/Neon**: More common for Next.js but Postgres adds cost and complexity for a simple blog
- **Self-hosted VPS with Docker**: Full control but more ops overhead

## See Also

- [[cloudflare-deployment]]
- [[blog-api]]