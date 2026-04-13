# admin-panel

> **Summary**: Blog admin panel at `/admin` for creating, editing, and deleting posts. Features a Tiptap rich text editor with Markdown support, AI-powered title/slug/excerpt suggestions via GLM-5.1, and real-time voice dictation via ElevenLabs Scribe v2. Protected by cookie-based auth with SHA-256 hashed passwords.

## Location
- **Files**: 5 source files
  - `src/app/admin/page.tsx` — Server page wrapper with noindex metadata
  - `src/app/admin/admin-client.tsx` — Main admin UI: post list, editor form, AI suggestions
  - `src/app/admin/login/page.tsx` — Login page wrapper
  - `src/app/admin/login/login-client.tsx` — Login form client component
  - `src/lib/auth.ts` — Auth utilities: isAdminRequest, isAuthenticated, handleLogin, handleLogout

## Key Features
- **Post CRUD**: Create, edit, delete blog posts with slug, title, excerpt, cover image, content, tags, publish toggle
- **AI Suggestions**: `POST /api/ai/suggest` sends content to GLM-5.1 via Ollama Cloud to generate title, slug, and excerpt
- **Voice Dictation**: See [[voice-dictation]]
- **Cookie Auth**: Session tokens stored in `moikapy_session` cookie, HMAC-signed with SESSION_SECRET

## Design Decisions
- See [[003-tiptap-markdown-editor]] — Tiptap chosen for rich text editing
- See [[002-elevenlabs-scribe-voice-dictation]] — ElevenLabs chosen for voice dictation

## Evolution
- **2026-04-13** — Initial enrichment from source analysis

---
*Last updated: 2026-04-13*