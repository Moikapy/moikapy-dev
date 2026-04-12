"use client";

import { useState, useCallback, useRef } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [error, setError] = useState<string | null>(null);
  const fullTranscriptRef = useRef("");

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    vadSilenceThresholdSecs: 1.2,
    onCommittedTranscript: (data) => {
      // Each committed segment appends to the running transcript
      fullTranscriptRef.current += data.text;
      onTranscript(fullTranscriptRef.current);
    },
    onAuthError: (data) => setError(`Auth: ${data.error}`),
    onQuotaExceededError: () => setError("ElevenLabs quota exceeded"),
    onTranscriberError: (data) => setError(`Transcription: ${data.error}`),
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Connection error");
    },
  });

  const startRecording = useCallback(async () => {
    setError(null);
    fullTranscriptRef.current = "";

    // Get a single-use token from our backend
    try {
      const tokenRes = await fetch("/api/scribe-token", { method: "POST" });
      if (!tokenRes.ok) {
        const err = (await tokenRes.json().catch(() => ({ error: "Auth failed" }))) as { error?: string };
        setError(err.error || "Failed to get scribe token");
        return;
      }
      const tokenData = (await tokenRes.json()) as { token: string };
      const { token } = tokenData;

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
    }
  }, [scribe, onTranscript]);

  const stopRecording = useCallback(() => {
    scribe.disconnect();
  }, [scribe]);

  const toggleRecording = () => {
    if (scribe.isConnected || scribe.isTranscribing) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isActive = scribe.isConnected || scribe.isTranscribing;

  const formatStatus = () => {
    if (scribe.status === "connecting") return "Connecting…";
    if (scribe.status === "transcribing") return "Listening…";
    if (scribe.status === "connected") return "Listening…";
    return "";
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleRecording}
        disabled={scribe.status === "connecting"}
        title={
          isActive ? "Stop dictation" : "Start dictation"
        }
        className={`relative rounded-md p-1.5 transition-all ${
          isActive
            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            : scribe.status === "connecting"
              ? "bg-yellow-500/20 text-yellow-500"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        {scribe.status === "connecting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isActive ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
        )}
      </button>

      {isActive && (
        <span className="text-xs text-red-500 font-medium">
          {formatStatus()}
        </span>
      )}

      {scribe.partialTranscript && isActive && (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate italic">
          {scribe.partialTranscript}
        </span>
      )}

      {error && (
        <span className="flex items-center gap-1 text-xs text-destructive" title={error}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[160px]">{error}</span>
        </span>
      )}
    </div>
  );
}