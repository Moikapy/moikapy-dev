# ADR-004: Origen Daily Writer for Automated Blog Posts

> **Status**: Accepted

## Context
Need automated content generation based on trending topics. Origen already has community insights data showing what readers are interested in. Want factual content, not hallucinations. Posts must be drafts until admin reviews.

## Decision
Origen Daily Writer: Cron-triggered at 6am ET daily. Reads trending tags from community insights KV cache. Uses DuckDuckGo web search tool for factual research. Writes full blog posts as drafts with author='Origen'. Admin toggle to enable/disable. Max 1 post per day (idempotent). Web search ensures factual grounding — no hallucinated sources. Posts show 'Written by Origen ⚡' byline when author !== 'Moikapy'.

## Consequences
- (to be determined)

## Alternatives Considered
Manual blog post creation only; Third-party writing service; Origen with auto-publish

## References
- Created: 2026-05-18

## See Also
- [[index]]
