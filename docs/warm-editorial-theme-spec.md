# Warm Editorial Theme + Admin Insights — Spec

## 1. Admin: Community Insights Tab

### What
Add an "Insights" tab to the admin panel showing community-driven data:
- Trending tags (last 7/30 days) with view counts
- Trending posts (last 7/30 days) with view counts
- Origen-generated content strategy advice
- Last refreshed timestamp
- Manual refresh button

### Where
New tab in `AdminClient` alongside Dashboard, Posts, and Analytics.

### UI
- Card layout matching existing admin style
- Bar chart for trending tags (reuse MiniBarChart)
- Post list with view counts for trending posts
- AI advice in a highlighted card with ✨ icon
- Refresh button that calls `/api/ai/insights`

### Data Source
- `GET /api/ai/insights` — returns `CommunityInsights` JSON
- KV cache refreshed every 30 min by cron

---

## 2. Blog: Warm Editorial Theme

### What
Transform the current monochrome/cold dark theme into a warm, literary editorial feel.

### Current State
- oklch-based colors: cold blacks `oklch(0.145 0 0)`, pure white backgrounds
- sans-serif only (Geist Sans)
- Very minimal — no warmth, no personality

### Target: Warm Editorial

#### Color Palette
| Token | Current (Dark) | Warm Editorial (Dark) | Purpose |
|-------|-------|-------|---------|
| background | `oklch(0.145 0 0)` | `#1a1614` (warm near-black) | Page bg |
| foreground | `oklch(0.985 0 0)` | `#f5f0e8` (warm cream) | Text |
| primary | `oklch(0.922 0 0)` | `#e8c47c` (warm gold) | Links, CTAs, accent |
| primary-foreground | `oklch(0.205 0 0)` | `#1a1614` | Text on primary |
| muted | `oklch(0.269 0 0)` | `#2a2520` (warm dark brown) | Cards, secondary bg |
| muted-foreground | `oklch(0.708 0 0)` | `#a89f8f` (warm mid) | Secondary text |
| accent | `oklch(0.269 0 0)` | `#3d2e1f` (warm brown) | Hover states |
| accent-foreground | `oklch(0.985 0 0)` | `#f5f0e8` | Text on accent |
| border | `oklch(1 0 0 / 10%)` | `#3d3530` | Card borders, dividers |

| Token | Current (Light) | Warm Editorial (Light) | Purpose |
|-------|-------|-------|---------|
| background | `oklch(1 0 0)` | `#faf8f5` (warm white) | Page bg |
| foreground | `oklch(0.145 0 0)` | `#2c2420` (warm dark) | Text |
| primary | `oklch(0.205 0 0)` | `#8b6914` (warm amber) | Links, CTAs |
| primary-foreground | `oklch(0.985 0 0)` | `#faf8f5` | Text on primary |
| muted | `oklch(0.97 0 0)` | `#f0ebe3` (warm light) | Cards, secondary bg |
| muted-foreground | `oklch(0.556 0 0)` | `#7a6f62` (warm mid) | Secondary text |
| border | `oklch(0.922 0 0)` | `#e0d5c8` | Card borders |

#### Typography
- **Headings**: Serif font (Merriweather or Lora via Google Fonts)
- **Body**: Keep Geist Sans (clean, modern readability)
- **Code/blocks**: Keep Geist Mono

Key changes:
1. `font-heading` → serif font for h1, h2, h3
2. Prose headings → `font-heading` class
3. Blog post headings → serif with warm gold accents

#### Components to Update
- `globals.css` — New CSS variables for both light and dark themes
- `layout.tsx` — Add serif font import
- `post-card.tsx` — Warmer card style with gold accent on hover
- `trending-this-week.tsx` — ✨ emoji + warm gold accent
- `topic-spotlight.tsx` — Warm brown background for spotlight card
- `related-posts.tsx` — Muted warm brown hover states
- `globals.css .prose` — Serif headings, warmer link colors

---

## Files to Create/Modify

### New
- `src/app/admin/admin-client.tsx` — Add "Insights" tab (extend existing)

### Modified
- `src/app/globals.css` — Warm editorial color palette
- `src/app/layout.tsx` — Add serif font (Lora/Merriweather)
- `src/components/post-card.tsx` — Warmer styling
- `src/components/trending-this-week.tsx` — Gold accent
- `src/components/topic-spotlight.tsx` — Warm brown background
- `src/components/related-posts.tsx` — Warm hover states
- `src/app/(site)/page.tsx` — Use warm theme classes
- `src/app/(site)/blog/page.tsx` — Use warm theme classes
- `src/app/(site)/blog/[slug]/page.tsx` — Serif headings

### No new dependencies needed
- Serif font via `next/font/google` (already supported)
- Colors via CSS custom properties (already using shadcn pattern)