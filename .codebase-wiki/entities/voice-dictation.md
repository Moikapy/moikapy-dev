# voice-dictation

> Real-time speech-to-text dictation in the blog editor using ElevenLabs Scribe v2 WebSocket API. VoiceInput component streams mic audio via `@elevenlabs/react` `useScribe` hook with VAD commit strategy. Single-use tokens from `/api/scribe-token` keep the API key server-side. Committed segments insert at Tiptap cursor via `editor.commands.insertContent()`.

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

## Source Files
- `src/components/voice-input.tsx` — VoiceInput React component, useScribe hook, mic button UI
- `src/app/api/scribe-token/route.ts` — Generates single-use ElevenLabs tokens (admin-auth required)

## Key Details
- **Token**: `POST /api/scribe-token` calls `https://api.elevenlabs.io/v1/single-use-token/realtime_scribe`, 15-min TTL
- **Model**: `scribe_v2_realtime` — ~150ms latency, 90+ languages
- **VAD**: Auto-commits on speech pauses (1.2s silence threshold)
- **ssr: false**: Dynamic import because `@elevenlabs/client` uses WebSocket, AudioWorkletNode, navigator.mediaDevices
- **Insertion**: `editor.chain().focus().insertContent(text).run()` per committed segment — avoids Tiptap state desync

## Dependencies
- `@elevenlabs/react` — useScribe hook, CommitStrategy enum
- `@elevenlabs/elevenlabs-js` — ElevenLabs client SDK
- `lucide-react` — Mic, MicOff, Loader2, AlertCircle icons

## Related Decisions
- ADR-002: ElevenLabs Scribe v2 for Voice Dictation (see `decisions/` dir)

## Cross-References
- [[admin-panel]] — Where VoiceInput appears in the editor toolbar
- [[tiptap-editor]] — How dictation integrates via `enableDictation` prop