# format-agent-harness

> **Summary**: Agent-harness pattern for the AI format endpoint. Uses a continuation loop to detect truncated LLM output and send "continue" messages, plus context passing between chunks for consistent formatting style. Replaces the previous single-shot approach that truncated after a few sentences.

## Applies To
- [[format-route]]
- [[admin-panel]]

## Description
The format endpoint wraps the LLM in a while loop (the "harness"). After each model response, a truncation detector checks if the output ends mid-sentence (no closing punctuation, ends with comma/colon/word character). If truncated, the harness appends the partial output as an assistant message and sends a "continue" user message, repeating up to MAX_CONTINUATIONS (4) times. The client passes `previousFormatted` context so each chunk inherits the style decisions (heading levels, list formats) of the prior chunk.

## Key Characteristics
- (to be discovered)

## See Also
- [[index]]

---
*Created: 2026-04-14*