# format-route

> **Summary**: AI format endpoint at /api/ai/format that reformats voice-dictated text into clean Markdown. Uses GLM-5.1:cloud with think:false (eliminates chain-of-thought overhead), num_predict:8192, and continuation loop (up to 4 rounds) that detects truncated output via looksTruncated() heuristic and sends "continue" messages. Single-request approach (no chunking) for up to 8000 chars. System prompt explicitly requires preserving ALL sentences to prevent summarization.

## Location

- **Type**: service

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/app/api/ai/format/route.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-14** — Initial creation

## See Also
- [[index]]
