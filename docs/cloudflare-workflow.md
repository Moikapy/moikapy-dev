# Cloudflare + Git Workflow for 0xKobold Projects

> Battle-tested patterns from moikapy.dev and future projects.

## Cloudflare Deployment

### Initial Setup

```bash
# Create D1 database
wrangler d1 create <db-name>

# Run migrations locally
wrangler d1 migrations apply <db-name> --local

# Run migrations on production
wrangler d1 migrations apply <db-name> --remote

# Set secrets (NEVER in code or .env files committed to git)
wrangler secret put ADMIN_PASSWORD_HASH
wrangler secret put SESSION_SECRET
wrangler secret put OLLAMA_API_KEY
```

### Environment Variables Pattern

- **`.env.example`** — Committed to git. Empty placeholders. Documents what vars exist.
- **`.env.local`** — Local dev values. Gitignored. Never committed.
- **`wrangler secret put`** — Production secrets. Stored in Cloudflare, never in code.

In code, read env vars with this fallback pattern:

```typescript
function getEnvVar(key: string): string | undefined {
  try {
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx.env?.[key] as string | undefined;
  } catch {
    // Not in Cloudflare context (local dev)
    return process.env[key];
  }
}
```

### D1 Database (SQLite on Cloudflare)

- Schema lives in `drizzle/` as numbered SQL migrations
- Local dev uses `better-sqlite3` via `drizzle-orm` (stored in `.local/dev.db`)
- Production uses Cloudflare D1
- The `getDb()` helper switches automatically based on context

### Build & Deploy

```bash
# Build for Cloudflare
bun run build:cf    # or: opennextjs-cloudflare build

# Deploy to Cloudflare
bun run deploy      # or: wrangler deploy

# Local dev
bun run dev         # or: next dev --turbopack
bun run preview     # or: wrangler dev (local CF emulation)
```

### Protecting Routes

```typescript
// middleware.ts — Protect admin and API routes
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/posts/:path*",
    "/api/auth/:path*",
    "/api/knowledge",
    "/api/ai/:path*",   // Add new API groups here
  ],
};
```

---

## Git Workflow

### Branch Strategy

- **`master`** (or `main`) — Production-ready code. Only merged via fast-forward or clean merge.
- **`feat/<name>`** — Feature branches. Created from master, merged back when done.
- **`fix/<name>`** — Bug fix branches.
- **`chore/<name>` — Housekeeping (deps, gitignore, etc.)

### Commit Conventions

```
feat: AI-powered title/slug/excerpt suggestions + slug collision detection
fix: remove duplicate reaction heading, add analytics
chore: remove .wrangler/ from git, add to .gitignore
```

Format: `type: concise description`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

**Rules:**
- Commits should be atomic — one logical change per commit
- Never force push to master/main
- Rewrite history only on your own feature branches, never shared ones

### Committing Sensitive Files

Always check before committing:

```bash
# What's about to be committed?
git add -A && git diff --cached --stat

# Never commit these:
# .env.local, .env*.local, .nsec, .wrangler/, .local/
```

If something slips through:

```bash
# Remove from git tracking (keeps local file)
git rm --cached <file>

# Future-proof in .gitignore
echo "<file>" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore <file> and remove from tracking"
```

---

## Git Worktrees

Worktrees let you work on multiple branches simultaneously without stashing:

```bash
# Create a worktree for a feature
git worktree add ../moikapy-feature feat/some-feature

# Work in that directory independently
cd ../moikapy-feature
# ... make changes, commit ...

# When done, remove the worktree
git worktree remove ../moikapy-feature
```

Use worktrees when:
- You need to context-switch between features frequently
- You want to run dev servers on different branches simultaneously
- You're reviewing a PR while working on your own stuff

---

## Pull Requests & Issues

### Creating PRs

```bash
# Push feature branch
git push origin feat/my-feature

# Create PR (GitHub CLI or web)
gh pr create --title "feat: my feature" --body "Description of changes"

# Or use the pi tool
# git_pr with repo, title, body
```

### PR Checklist
- [ ] No secrets in code or git history
- [ ] All env vars documented in `.env.example`
- [ ] `.gitignore` covers local dev artifacts
- [ ] Build passes (`bun run build`)
- [ ] No leftover console.logs or debug code

### Issues

Use GitHub Issues for:
- Bug tracking
- Feature requests
- Technical debt reminders

```bash
# Create an issue
gh issue create --title "Bug: duplicate slug crashes admin" --body "Description..."

# Or with pi
# git_issue with repo, title, body, labels
```

---

## Testing

### Current Project Testing Strategy

moikapy.dev uses **manual testing** (no formal test framework yet). This is acceptable for a solo project in early stages.

### When to Add Tests

Add tests when:
- You have business logic with multiple edge cases (e.g., slug collision detection)
- You have API contracts that other services depend on
- You fix a bug — write a test that reproduces it first (regression prevention)

### Testing Commands (when added)

```bash
# Run tests (when configured)
bun test

# Run specific test file
bun test src/lib/posts.test.ts
```

### Recommended Test Stack (future)

- **Bun test runner** — built-in, fast, no extra deps
- **Vitest** — if you want Jest-compatible API
- Focus on integration tests for API routes, unit tests for pure functions like `slugify()`

---

## Security Checklist

### Before Every Deploy

1. **Secrets scan** — Run `secret_scan` or `git diff --staged | grep -i "key\|secret\|password\|token"`
2. **No `.env.local` in git** — `git ls-files | grep .env.local` should return nothing
3. **No `.wrangler/` in git** — `git ls-files | grep .wrangler` should return nothing
4. **New API routes protected** — Check `middleware.ts` matcher config
5. **Cloudflare secrets set** — `wrangler secret list` to verify
6. **`.env.example` updated** — Every new secret should have an entry

### Ollama Cloud API Pattern

```typescript
// Route: /api/ai/suggest/route.ts
const OLLAMA_API_URL = "https://ollama.com/api/chat";

// Auth: Bearer token from env
const apiKey = getEnvVar("OLLAMA_API_KEY");

// Request
const response = await fetch(OLLAMA_API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({ model: "glm-5.1", messages, stream: false }),
});

// Response parsing — handle markdown-wrapped JSON
const data = await response.json();
const rawContent = data.message?.content ?? "";
const codeBlockMatch = rawContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
const jsonStr = codeBlockMatch ? codeBlockMatch[1] : rawContent;
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local dev | `bun run dev` |
| Build for CF | `bun run build:cf` |
| Deploy to CF | `bun run deploy` |
| Run migrations (local) | `wrangler d1 migrations apply <db> --local` |
| Run migrations (prod) | `wrangler d1 migrations apply <db> --remote` |
| Set a secret | `wrangler secret put <KEY>` |
| List secrets | `wrangler secret list` |
| Hash admin password | `bun run auth:hash-password` |
| Check git status | `git status` |
| Check staged files | `git diff --cached --stat` |
| Scan for secrets | `secret_scan` (pi tool) |
| Create repo on GitHub | `git_package_init` (pi tool) |
| Push to GitHub | `git push origin <branch>` |
| Create PR | `git_pr` (pi tool) |

---

*Built with 🐉 by Shalom — 0xKobold*