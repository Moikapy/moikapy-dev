# README Summary

> **Summary**: Project README documentation.

# moikapy.dev

Personal blog of **moikapy** — AI Engineer x Gamer.

Built with **Next.js 16**, **Tailwind CSS v4**, and **shadcn/ui**. Deployed on **Cloudflare Pages** with **Cloudflare D1** for blog post storage.

## Features

- 📝 Blog with admin panel — write and publish from any device at `/admin`
- 🔐 Password-protected admin — login from your phone, tablet, anywhere
- 🗄️ **Cloudflare D1** database — no git commits needed to publish posts
- 📡 RSS feed at `/feed/rss.xml`
- ⚡ Nostr feed at `/feed/nostr.json` (NIP-23 long-form content)
- 🌑 Dark mode by default
- 🔍 SEO optimized (sitemap, robots.txt, Open Graph)
- 🚀 Deployed on Cloudflare with OpenNext

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Create the D1 database

```bash
bunx wrangler login
bun run db:create
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "moikapy-blog"
database_id = "YOUR_ID_HERE"
```

### 3. Set up admin authentication

Generate a password hash:

```bash
bun run auth:hash-password your-password-here
```

This outputs something like `ADMIN_PASSWORD_HASH=abc123...`. Set it as a Cloudflare secret:

```bash
# Set the password hash
wrangler secret put ADMIN_PASSWORD_HASH
# Paste the hash when prompted

# Generate and set a session signing secret
openssl rand -hex 32
wrangler secret put SESSION_SECRET
# Paste the generated hex string
```

For local development, add both to `.env.local`:

```
ADMIN_PASSWORD_HASH=your-hash-here
SESSION_SECRET=your-random-hex-here
```

### 4. Run the migrations

```bash
bun run db:migrate:local     # Local development
bun run db:migrate:remote    # Production (after first deploy)
```

### 5. Local development

```bash
bun run dev        # Next.js dev server (no D1 — admin/blog won't fully work)
bun run preview     # Cloudflare dev server with D1 (full stack)
```

### 6. Deploy

```bash
bun run build
bun run build:cf
bun run deploy
```

## Writing 

... (truncated)

## See Also
- [[index]]
