# voice-dictation

> **Summary**: Real-time speech-to-text dictation in the blog editor using ElevenLabs Scribe v2 WebSocket API. The `VoiceInput` component (dynamic-imported with `ssr: false`) streams mic audio via `@elevenlabs/react` `useScribe` hook with VAD commit strategy. Single-use tokens generated server-side at `/api/scribe-token` (admin-auth protected) keep the API key off the client. Committed transcript segments are inserted at the Tiptap cursor position via `editor.commands.insertContent()`.

## Location
- **Files**: 2 source files
  - `src/components/voice-input.tsx` — VoiceInput React component with mic button, useScribe hook, partial/committed transcript display
  - `src/app/api/scribe-token/route.ts` — Server-side API route that generates single-use ElevenLabs tokens (POST, admin-auth required)

## Architecture

```
Browser                          Server                    ElevenLabs
  |                                |                          |
  | Click mic                      |                          |
  | POST /api/scribe-token         |                          |
  | <--- { token } -----          |                          |
  | useScribe.connect({ token })  |                          |
  | WebSocket wss://api.elevenlabs.io/v1/speech-to-text/realtime        |
  | <--- partial_transcript ----- |                          |
  | <--- committed_transcript ---- |                          |
  | editor.commands.insertContent()|                          |
  | editor.onUpdate → onChange()  |                          |
```

## Key Details
- **Token**: `POST /api/scribe-token` calls `https://api.elevenlabs.io/v1/single-use-token/realtime_scribe` with the server's API key, returns a 15-min single-use token
- **Model**: `scribe_v2_realtime` — ~150ms latency, 90+ languages
- **VAD**: Voice Activity Detection auto-commits transcript on speech pauses (1.2s silence threshold)
- **ssr: false**: `@elevenlabs/client` uses browser APIs (WebSocket, AudioWorkletNode, navigator.mediaDevices) that crash during SSR
- **Insertion**: Each committed segment calls `editor.chain().focus().insertContent(text).run()`, not `setFormContent()` — avoids Tiptap state desync

## Dependencies
- `@elevenlabs/react` — useScribe hook, CommitStrategy enum
- `@elevenlabs/elevenlabs-js` — ElevenLabs client SDK
- `lucide-react` — Mic, MicOff, Loader2, AlertCircle icons

## Design Decisions
- See [[002-elevenlabs-scribe-voice-dictation]] — ADR for choosing ElevenLabs over alternatives

## See Also
- [[admin-panel]] — Where VoiceInput appears in the editor toolbar
- [[tiptap-editor]] — How dictation integrates via enableDictation prop and insertContent()

## Evolution
- **2026-04-13** — Initial implementation

---
*Last updated: 2026-04-13*