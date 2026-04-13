# admin-panel

> Blog admin at `/admin` for creating, editing, and deleting posts. Tiptap rich text editor with Markdown support, AI title/slug/excerpt suggestions via GLM-5.1, and ElevenLabs Scribe v2 voice dictation. Cookie-based auth with SHA-256 hashed passwords.

## Source Files
- `src/app/admin/page.tsx` — Server page wrapper with noindex metadata
- `src/app/admin/admin-client.tsx` — Main admin UI: post list, editor form, AI suggestions
- `src/app/admin/login/page.tsx` — Login page wrapper
- `src/app/admin/login/login-client.tsx` — Login form client component
- `src/lib/auth.ts` — Auth utils: `isAdminRequest`, `isAuthenticated`, `handleLogin`, `handleLogout`

## Key Features
- **Post CRUD**: Create, edit, delete with slug, title, excerpt, cover image, content, tags, publish toggle
- **AI Suggestions**: `POST /api/ai/suggest` → GLM-5.1 via Ollama Cloud → title, slug, excerpt
- **Voice Dictation**: See [[voice-dictation]]
- **Cookie Auth**: HMAC-signed session tokens in `moikapy_session` cookie (7-day expiry)

## Cross-References
- [[tiptap-editor]] — Rich text editor component
- [[voice-dictation]] — Speech-to-text mic integration
- [[blog-api]] — API endpoints the admin calls