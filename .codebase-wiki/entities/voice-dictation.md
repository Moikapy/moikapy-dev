# voice-dictation

> **Summary**: Real-time speech-to-text dictation in the blog editor using ElevenLabs Scribe v2 WebSocket API. VoiceInput component (dynamic-imported with ssr:false) streams mic audio via @elevenlabs/react useScribe hook with VAD commit strategy. Single-use tokens generated server-side at /api/scribe-token (admin-auth protected) keep the API key off the client. Committed transcript segments are inserted at the Tiptap cursor position via editor.commands.insertContent().

## Location

- **Type**: module

## Responsibilities
- (to be documented)

## Dependencies
- (to be discovered)

## Dependents
- (to be discovered)

## Key Files
- `src/components/voice-input.tsx`
- `src/app/api/scribe-token/route.ts`

## Design Decisions
- (to be documented)

## Evolution
- **2026-04-13** — Initial creation

## See Also
- [[index]]
