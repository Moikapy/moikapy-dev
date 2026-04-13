# cloudflare-deployment

> **Summary**: The app deploys as a Cloudflare Worker via OpenNext (`opennextjs-cloudflare`). D1 (SQLite) stores blog posts. Secrets managed via `wrangler secret put`: ADMIN_PASSWORD_HASH, SESSION_SECRET, OLLAMA_API_KEY, ELEVENLABS_API_KEY. Static assets served from Workers Sites. `wrangler.toml` configures DB binding, WORKER_SELF_REFERENCE, and compatibility flags.

## Location
- **Files**:
  - `wrangler.toml` — Worker name, D1 binding, compatibility flags, secrets list
  - `open-next.config.ts` — OpenNext configuration for Cloudflare
  - `next.config.ts` — Next.js config (minimal, no customizations)
  - `drizzle.config.ts` — Drizzle ORM config pointing at D1
  - `drizzle/` — Migration files for D1 schema

## Environment Secrets
| Secret | Purpose |
|--------|---------|
| `ADMIN_PASSWORD_HASH` | SHA-256 hash of admin password |
| `SESSION_SECRET` | HMAC key for session token signing |
| `OLLAMA_API_KEY` | Ollama Cloud API key for AI suggestions |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice dictation |

## Commands
- `bun run dev` — Local dev with Turbopack
- `bun run build:cf` — Build for Cloudflare
- `bun run preview` — Wrangler dev (local D1)
- `bun run deploy` — Wrangler deploy to Cloudflare
- `bun run db:migrate:local` — Apply D1 migrations locally
- `bun run db:migrate:remote` — Apply D1 migrations to production

## See Also
- [[001-cloudflare-workers-d1]] — ADR for choosing Cloudflare over Vercel
- [[blog-api]] — Uses D1 for post storage
- [[voice-dictation]] — Uses ELEVENLABS_API_KEY secret

## Evolution
- **2026-04-13** — Initial enrichment from source analysis

---
*Last updated: 2026-04-13*