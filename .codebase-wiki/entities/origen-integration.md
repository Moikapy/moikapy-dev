# origen-integration

> **Summary**: Origen (@moikapy/origen) is the LLM agent engine used for AI routes and community insights. callOrigen() for suggest, streamOrigen() for format with continuation harness. Model: openrouter/free (auto best-free-model). thinkingLevel: "off" to avoid thinking token waste. Community insights cron calls Origen for content advice (what to write next). Config in src/lib/origen.ts. No origen-zero needed — plain OrigenTool (TypeScript) for D1 queries.

## Location

- **Type**: module

## Key Files
- `src/lib/origen.ts`
- `src/app/api/ai/suggest/route.ts`
- `src/app/api/ai/format/route.ts`
- `src/app/api/ai/insights/route.ts`

## See Also
- [[admin-panel]]
- [[community-insights]]
- [[format-agent-harness]]
