# tiptap-editor

> Rich text editor component built on Tiptap (ProseMirror) with Markdown serialization via `tiptap-markdown`. Toolbar provides undo/redo, formatting, headings, lists, code blocks, blockquote, links, images, and optional voice dictation mic button. Content flows as Markdown — dictation inserts at cursor via `editor.commands.insertContent()`.

## Source File
- `src/components/tiptap-editor.tsx`

## Extensions
- StarterKit (bold, italic, strike, headings 1-3, bullet/ordered lists)
- Link (`openOnClick: false`)
- Image (rounded styling)
- Placeholder ("Start writing your post...")
- CodeBlockLowlight (syntax-highlighted via lowlight/common)
- HorizontalRule
- Markdown (bidirectional serialization)

## Props
- `value: string` — Initial Markdown content (mount-only, not reactive)
- `onChange: (markdown: string) => void` — Fires on every update with extracted Markdown
- `enableDictation?: boolean` — Shows VoiceInput mic button in toolbar

## Design Note
`value` prop sets `content` on init only — external state changes must use `editor.commands` directly (e.g. `insertContent` for dictation), not re-render via props.

## Cross-References
- [[voice-dictation]] — VoiceInput component used in toolbar
- [[admin-panel]] — Where TiptapEditor renders