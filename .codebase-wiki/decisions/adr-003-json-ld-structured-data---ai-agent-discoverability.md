# ADR-003: JSON-LD Structured Data + AI Agent Discoverability

> **Status**: Accepted

## Context
Site lacked JSON-LD structured data (critical for Google rich results and AI crawlers), had no generateStaticParams (every blog hit was server-rendered), no llms-full.txt (full content for AI crawlers), and no canonical URLs on interior pages.

## Decision
Added full JSON-LD implementation with WebSite, Person, BlogPosting, and BreadcrumbList schemas. Added generateStaticParams to blog posts for SSG. Created dynamic llms-full.txt endpoint. Added canonical URLs and improved OG metadata. Created reusable seo-and-agent-discoverability skill for future sites.

## Consequences
- (to be determined)

## Alternatives Considered
- None documented yet

## References
- Created: 2026-04-14

## See Also
- [[index]]
