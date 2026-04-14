# format-truncation-fix

> **Summary**: Fix for the AI format tool truncating/stopping early when formatting voice-dictated text. Three root causes: thinking tokens eating the budget, chunking causing summarization, and Tiptap not syncing value prop changes.

## Applies To
- [[format-route]]
- [[admin-panel]]
- [[tiptap-editor]]

## Description
Root causes and fixes for the format tool truncating voice-dictated text:\n\n1. **think:false** — GLM-5.1 chain-of-thought consumed the entire num_predict token budget before content tokens began. Disabling thinking freed the budget.\n2. **Removed client-side chunking** — 1200-char chunks caused independent summarization, losing content. Now sends full text in one request (up to 8000 chars).\n3. **Tiptap useEffect sync** — editor.commands.setContent(value) added so setFormContent updates actually render in the editor.\n4. **isAuthenticated() fallback** — was missing process.env.SESSION_SECRET fallback, breaking dev auth entirely.\n5. **Cookie secure:true** — blocked localhost HTTP sessions.\n6. **System prompt** — "You MUST include EVERY sentence" prevents the model from summarizing.

## Key Characteristics
- (to be discovered)

## See Also
- [[index]]

---
*Created: 2026-04-14*