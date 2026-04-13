# tiptap-editor

> **Summary**: Rich text editor component (`TiptapEditor`) built on Tiptap (ProseMirror) with Markdown serialization via `tiptap-markdown`. Provides a full toolbar (undo/redo, formatting, headings, lists, code blocks, blockquote, links, images) and an optional voice dictation mic button. Content flows as Markdown — `onUpdate` extracts via `editor.storage.markdown.getMarkdown()` and calls `onChange()`. Dictation inserts text at cursor using `editor.chain().focus().insertContent()`.

## Location
- **File**: `src/components/tiptap-editor.tsx`

## Extensions
- **StarterKit** — Bold, italic, strike, headings (1-3), bullet/ordered lists, code blocks (disabled in favor of CodeBlockLowlight)
- **Link** — Clickable links with `openOnClick: false`
- **Image** — Inline images with rounded styling
- **Placeholder** — "Start writing your post..." when empty
- **CodeBlockLowlight** — Syntax-highlighted code blocks using lowlight (common languages)
- **HorizontalRule** — Thematic breaks
- **Markdown** — Bidirectional Markdown serialization (`html: true`, `transformPastedText: true`, `transformCopiedText: true`)

## Props
- `value: string` — Initial Markdown content (only used on mount)
- `onChange: (markdown: string) => void` — Called on every update with extracted Markdown
- `enableDictation?: boolean` — Shows VoiceInput mic button in toolbar

## Design Decisions
- See [[003-tiptap-markdown-editor]] — ADR for choosing Tiptap + Markdown
- **No controlled content**: `value` prop sets `content` on init only. External state changes (like dictation) must use `editor.commands` directly, not re-render via props.
- **Dynamic import for VoiceInput**: Loaded via `next/dynamic({ ssr: false })` because `@elevenlabs/client` uses browser-only APIs.

## See Also
- [[voice-dictation]] — Voice dictation component used in toolbar
- [[admin-panel]] — Where TiptapEditor is rendered

## Evolution
- **2026-04-13** — Initial implementation

---
*Last updated: 2026-04-13*