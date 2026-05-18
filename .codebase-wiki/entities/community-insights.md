# community-insights

> **Summary**: Community-driven homepage feature using D1 analytics + KV cache. Origen acts as curator (not editor) — recommends what to surface, doesn't modify page layout. KV cache refreshed every 30 min by cron. Homepage reads from KV (zero-latency). Falls back to D1-only queries if KV empty. Components: TrendingThisWeek, TopicSpotlight (homepage), RelatedPosts (blog post pages). Admin Insights tab shows trending tags, spotlight topic, and Origen content advice.

## Location

- **Type**: module

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/lib/community-insights.ts`
- `src/app/api/ai/insights/route.ts`
- `src/components/trending-this-week.tsx`
- `src/components/topic-spotlight.tsx`
- `src/components/related-posts.tsx`

## Design Decisions
- (to be documented)

## Evolution
- **2026-05-18** — Initial creation

## See Also
- [[index]]
