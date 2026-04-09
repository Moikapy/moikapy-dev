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

## Writing Posts

### From the admin panel

1. Visit `moikapy.dev/admin`
2. Enter your password
3. Click "+ New Post"
4. Write your post in markdown, add tags, toggle "Published"
5. Save — it's live

Works on any device — phone, tablet, laptop.

### Via the API

```bash
# Create a post (needs session cookie from login)
curl -X POST https://moikapy.dev/api/posts \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "slug": "my-post",
    "title": "My Post",
    "excerpt": "A short description",
    "content": "# Hello\n\nThis is my post...",
    "tags": ["ai", "gaming"],
    "published": true
  }'

# Update a post
curl -X PATCH https://moikapy.dev/api/posts/my-post \
  -H "Content-Type: application/json" \
  -d '{"published": false}'

# Delete a post
curl -X DELETE https://moikapy.dev/api/posts/my-post
```

## Nostr Publishing

### Generate a key pair (one-time)

```bash
bun run nostr:generate-keys
```

Save the `nsec` to `.env` and add the `npub` to `src/lib/config.ts`.

### Publish posts to Nostr relays

```bash
NSEC=nsec1... bun run nostr:publish
```

## Storage

| What | Where | Why |
|------|-------|-----|
| Blog posts | **Cloudflare D1** (SQLite) | Write from anywhere, no git required |
| Images/media | Cloudflare R2 (optional) | S3-compatible, zero egress fees |

## Auth Architecture

- **Password**: SHA-256 hashed, stored as Cloudflare secret (`ADMIN_PASSWORD_HASH`)
- **Session**: HMAC-SHA256 signed token, stored in httpOnly cookie (7 day expiry)
- **Protected routes**: `/admin/*` (redirects to `/admin/login`) and `/api/posts/*` (returns 401)
- **Public routes**: Blog pages, RSS, Nostr, login page

## Project Structure

```
├── drizzle/              # D1 migration SQL
├── scripts/              # Auth, Nostr, key generation
├── src/
│   ├── app/
│   │   ├── admin/        # Admin panel (login + post editor)
│   │   ├── api/
│   │   │   ├── auth/     # Login/logout API
│   │   │   └── posts/    # REST API for posts CRUD
│   │   ├── blog/         # Public blog pages
│   │   └── feed/         # RSS + Nostr feed endpoints
│   ├── components/       # React components
│   ├── db/               # Drizzle ORM + D1 schema
│   └── lib/              # Config, auth, posts API
├── middleware.ts         # Auth middleware (protects admin + API)
├── open-next.config.ts   # Cloudflare OpenNext config
└── wrangler.toml         # Cloudflare Workers config
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Next.js dev server |
| `bun run preview` | Cloudflare dev server (with D1) |
| `bun run build` | Production build |
| `bun run build:cf` | Build for Cloudflare |
| `bun run deploy` | Deploy to Cloudflare |
| `bun run db:create` | Create D1 database |
| `bun run db:migrate:local` | Run migrations locally |
| `bun run db:migrate:remote` | Run migrations on production D1 |
| `bun run auth:hash-password` | Hash a password for admin login |
| `bun run nostr:generate-keys` | Generate Nostr key pair |
| `bun run nostr:publish` | Publish posts to Nostr relays |