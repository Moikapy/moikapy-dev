# ADR-002: ElevenLabs Scribe v2 Real-Time for Voice Dictation

> **Status**: Accepted
> **Date**: 2026-04-13

## Context

The blog admin editor needs a voice dictation feature so posts can be dictated instead of typed. The solution must work in the browser, keep API keys server-side, and integrate naturally with the Tiptap editor.

## Decision

Use ElevenLabs Scribe v2 real-time WebSocket API via the `@elevenlabs/react` useScribe hook.

- **Real-time streaming**: ~150ms latency, text appears as you speak
- **VAD commit strategy**: Auto-commits transcript segments on speech pauses, giving natural dictation flow
- **Single-use tokens**: `/api/scribe-token` generates throwaway auth tokens (15-min TTL) so the API key never reaches the client
- **Cursor insertion**: Each committed segment is inserted at the Tiptap cursor via `editor.chain().focus().insertContent()`, not by replacing all content
- **Dynamic import**: VoiceInput is loaded with `next/dynamic({ ssr: false })` because `@elevenlabs/client` uses browser-only APIs (WebSocket, navigator.mediaDevices, AudioWorkletNode)
- **Admin-only**: Token endpoint protected by the same cookie-based auth as the rest of /admin

## Alternatives Considered

- **Batch upload (Scribe v2 non-realtime)**: Simpler (single REST call) but no live feedback — wait for recording to finish before seeing text
- **Browser Web Speech API**: Free and no API key needed, but quality is lower, no commercial license for transcription data, and inconsistent across browsers
- **OpenAI Whisper**: Good accuracy but batch-only, no real-time option

## See Also

- [[voice-dictation]]
- [[admin-panel]]
- [[tiptap-editor]]