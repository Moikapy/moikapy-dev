# ADR-003: Tiptap with Markdown Serialization for Blog Editing

> **Status**: Accepted
> **Date**: 2026-04-13

## Context

Need a rich text editor for the blog admin that stores content as Markdown (for portability and git-friendliness) while providing a WYSIWYG editing experience.

## Decision

Use Tiptap (ProseMirror-based) with the `tiptap-markdown` extension for bidirectional Markdown serialization.

- `onUpdate` extracts Markdown via `editor.storage.markdown.getMarkdown()`
- `content` prop initializes from Markdown on mount
- Editor does NOT react to external prop changes after init — dictation must use `editor.commands.insertContent()` rather than setting state
- Toolbar provides formatting, headings, lists, code blocks, links, images, and voice dictation

## Alternatives Considered

- **Plain textarea with Markdown**: No WYSIWYG, harder for dictation UX
- **Lexical (Meta)**: More complex to set up, Markdown support is less mature
- **Slate.js**: Lower level, more boilerplate needed

## See Also

- [[tiptap-editor]]
- [[admin-panel]]