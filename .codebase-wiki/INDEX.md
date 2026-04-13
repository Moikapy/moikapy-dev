# Codebase Wiki Index

> Auto-maintained knowledge base. Use `/wiki-query <question>` to search.

## Entities
- [[root]] — _root module, with 20 source files.
- [[admin-panel]] — Blog admin at /admin with tab navigation: Posts tab (CRUD editor with Tiptap, AI suggestions, ElevenLabs voice dictation) and Analytics tab (D1-backed page views, top paths, blog post views, referrer breakdown with 7/30/90 day selector). Cookie-based auth with SHA-256 hashed passwords. See also: [[analytics-api]], [[tiptap-editor]], [[voice-dictation]].
- [[analytics-api]] — Admin-only analytics endpoint at /api/analytics/views that reads page view data from D1 (page_views and page_referrers tables) and supplements with CF GraphQL zone-level totals. Also /api/analytics/track which records page views and referrers on every page load via client-side script. Supports 7/30/90 day ranges. Referrers are normalized to domain (strips www prefix, paths). Direct/bookmark visits stored as "direct".
- [[blog-api]] — blog-api module, with 3 source files, exports: PostWithReadingTime, dynamic, getDb, isLocalDev, parsePostTags.
- [[cloudflare-deployment]] — Deploys as a Cloudflare Worker via OpenNext with D1 (SQLite) for storage. Secrets managed through wrangler secret: ADMIN_PASSWORD_HASH, SESSION_SECRET, OLLAMA_API_KEY, ELEVENLABS_API_KEY, CF_API_TOKEN, CF_ZONE_ID. Static assets via Workers Sites. D1 tables: posts, reactions, page_views (analytics), page_referrers (referrer tracking). See [[analytics-api]] for analytics secrets, [[src-db]] for schema.
- [[docs]] — docs module in the codebase
- [[drizzle]] — drizzle module in the codebase
- [[public]] — public module in the codebase
- [[scripts]] — scripts module in the codebase
- [[src-db]] — Database layer using Drizzle ORM with D1 (SQLite). Schema includes: posts (slug, title, content, tags as JSON, published flag), reactions (emoji reactions per post by visitor hash), page_views (path+date composite key, view counts), page_referrers (referer domain+path+date, view counts). Migrations in drizzle/ directory. See [[analytics-api]] for how page_views and page_referrers are used.
- [[src-app]] — src/app module in the codebase
- [[src-components]] — src/components module in the codebase
- [[src-env-d-ts]] — src/env.d.ts module in the codebase
- [[src-lib]] — src/lib module in the codebase
- [[src-middleware-ts]] — src/middleware.ts module in the codebase
- [[tiptap-editor]] — tiptap-editor module, with 1 source file, exports: TiptapEditor.
- [[voice-dictation]] — voice-dictation module, with 2 source files, exports: VoiceInput, dynamic.
- [[x402-monetization]] — x402-monetization module, with 1 source file, exports: dynamic.

## Concepts
- [[analytics-tracking]] — D1-based page view and referrer tracking system. Client-side script in layout.tsx fires POST /api/analytics/track with path and referrer on each page load. Data stored in page_views (path, date, views) and page_referrers (referer, path, date, views) tables. Referrers normalized to domain (strips www prefix and paths; "direct" for no referrer). Admin analytics dashboard reads from D1 for per-path data, supplemented by CF GraphQL API for aggregate zone totals. See [[analytics-api]] and [[admin-panel]].

## Decisions (ADRs)
- [[adr-001-use-cf-graphql-analytics-api-for-page-view-tracking]] — Query the Cloudflare GraphQL Analytics API (httpRequests1dGroups) from the server for zone-level page view data. Uses clientRequestPath dimension to break down views per URL. Falls back to empty data 
- [[adr-002-use-d1-page-views-table-instead-of-cf-path-level-analytics]] — Use D1 SQLite table (page_views) with composite key (path, date) to track page views. Client-side script fires POST /api/analytics/track on each page load. D1 upsert is atomic and fast. CF GraphQL API

## Evolution

## Comparisons

---

*Last updated: 2026-04-13 • 23 pages total*
