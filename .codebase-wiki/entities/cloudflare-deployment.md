# cloudflare-deployment

> Deploys as a Cloudflare Worker via OpenNext with D1 (SQLite) for storage. Secrets managed through `wrangler secret`. Static assets via Workers Sites.

## Source Files
- `wrangler.toml` — Worker config, D1 binding, compatibility flags
- `open-next.config.ts` — OpenNext Cloudflare adapter config
- `next.config.ts` — Next.js config
- `drizzle.config.ts` — Drizzle ORM D1 config
- `drizzle/` — Migration SQL files

## Environment Secrets
| Secret | Purpose |
|--------|---------|
| `ADMIN_PASSWORD_HASH` | SHA-256 hash of admin password |
| `SESSION_SECRET` | HMAC key for session cookies |
| `OLLAMA_API_KEY` | Ollama Cloud API key for AI suggestions |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice dictation |

## Commands
| Command | What it does |
|---------|------------|
| `bun run dev` | Local dev with Turbopack |
| `bun run build:cf` | Build for Cloudflare |
| `bun run preview` | Wrangler local dev with D1 |
| `bun run deploy` | Production deploy |
| `bun run db:migrate:local` | Apply D1 migrations locally |
| `bun run db:migrate:remote` | Apply D1 migrations to production |

## Related Decisions
- ADR-001: Cloudflare Workers + D1 (see `decisions/` dir)

## Cross-References
- [[blog-api]] — Uses D1 for post storage
- [[voice-dictation]] — Uses ELEVENLABS_API_KEY secret