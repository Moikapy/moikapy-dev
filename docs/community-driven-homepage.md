# Community-Driven Dynamic Homepage — Spec

## Problem
The homepage shows the same 6 recent posts regardless of what the community is actually reading. There's no signal from engagement data back into what gets surfaced.

## Solution
Use D1 analytics data (page_views, post_tags) + Origen to compute community insights periodically. Store insights in KV. Render dynamic sections on the homepage and blog pages that reflect what the community cares about.

## Architecture

```
Every 30 min (Cron Trigger):
  → /api/ai/insights (GET, admin-only)
     → Reads page_views + post_tags from D1
     → callOrigen("analyze community interests", context=analytics data)
     → Writes insights JSON to KV

Homepage render:
  → getCommunityInsights() reads from KV (fast, no LLM in render path)
  → Renders TrendingThisWeek + TopicSpotlight sections

Blog post render:
  → getRelatedPosts(slug) reads from KV
  → Renders RelatedPosts section
```

## Data Flow

### D1 → Insights (cron, not real-time)
```sql
-- Top tags by views (last 30 days)
SELECT pt.tag, SUM(pv.views) as total_views
FROM page_views pv
JOIN post_tags pt ON pv.path LIKE '%/blog/' || pt.slug
WHERE pv.date > date('now', '-30 days')
GROUP BY pt.tag
ORDER BY total_views DESC

-- Top posts by views (last 7 days)
SELECT pv.path, SUM(pv.views) as views
FROM page_views pv
WHERE pv.path LIKE '/blog/%' AND pv.date > date('now', '-7 days')
GROUP BY pv.path
ORDER BY views DESC
LIMIT 10

-- Co-occurrence (read X also read Y)
SELECT a.slug as slug_a, b.slug as slug_b, COUNT(*) as overlap
FROM page_views pva
JOIN post_tags a ON pva.path LIKE '%/blog/' || a.slug
JOIN post_tags b ON b.tag = a.tag AND b.slug != a.slug
WHERE pva.date > date('now', '-30 days')
GROUP BY a.slug, b.slug
ORDER BY overlap DESC
```

### KV Schema
Key: `community_insights`
```json
{
  "trending_slugs": ["what-i-learned-...","open-weight-ai-models-ollama"],
  "trending_tags": ["cloudflare","ai","llm"],
  "spotlight_tag": "cloudflare",
  "spotlight_slugs": ["what-i-learned-...","ai-engineering-starter-kit"],
  "related": {
    "what-i-learned-building-with-cloudflare-and-openrouter": ["open-weight-ai-models-ollama","ai-engineering-starter-kit"],
    "open-weight-ai-models-ollama": ["ai-engineering-starter-kit","what-i-learned-building-with-cloudflare-and-openrouter"]
  },
  "content_advice": "Your cloudflare content outperforms everything else 4:1. Consider more hands-on tutorials.",
  "updated_at": "2026-05-17T22:00:00Z"
}
```

## Files to Create/Modify

### New Files
- `src/lib/community-insights.ts` — KV read/write + D1 queries for insights
- `src/app/api/ai/insights/route.ts` — Admin cron endpoint to compute & cache insights
- `src/components/trending-this-week.tsx` — Trending section component
- `src/components/topic-spotlight.tsx` — Spotlight section component
- `src/components/related-posts.tsx` — Related posts component

### Modified Files
- `src/app/(site)/page.tsx` — Add TrendingThisWeek + TopicSpotlight sections
- `src/app/(site)/blog/[slug]/page.tsx` — Add RelatedPosts section
- `wrangler.toml` — Add KV binding for COMMUNITY_INSIGHTS + cron trigger

## Implementation Phases

### Phase 1: Data Layer ✅ → 🔨
- [ ] `src/lib/community-insights.ts` — D1 analytics queries + KV cache read/write
- [ ] `src/app/api/ai/insights/route.ts` — Origen-powered insights endpoint
- [ ] KV binding in `wrangler.toml`

### Phase 2: Dynamic Sections
- [ ] `TrendingThisWeek` component
- [ ] `TopicSpotlight` component
- [ ] Homepage refactor with dynamic sections
- [ ] `RelatedPosts` component on blog post pages

### Phase 3: Cron + Polish
- [ ] Cron trigger in `wrangler.toml` to auto-refresh insights
- [ ] Admin analytics tab: show community insights
- [ ] Fallback when KV is empty (first deploy)