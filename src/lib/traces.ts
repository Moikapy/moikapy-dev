export const hfConfig = {
  repoId: "moikapy/0xKobolds",
  baseUrl: "https://huggingface.co/datasets/moikapy/0xKobolds/resolve/main",
  apiUrl: "https://huggingface.co/api/datasets/moikapy/0xKobolds",
} as const;

export interface TraceFile {
  filename: string;
  id: string;
  timestamp: string;
  date: Date;
  /** Size in bytes (from HF API) */
  size?: number;
}

export interface TraceSession {
  id: string;
  timestamp: string;
  cwd: string;
  version: number;
}

export interface TraceMessage {
  id: string;
  parentId: string | null;
  timestamp: string;
  message: {
    role: "user" | "assistant" | "system" | "tool";
    content: TraceContent[];
    usage?: {
      input: number;
      output: number;
      totalTokens: number;
      cost: { total: number };
    };
    stopReason?: string;
  };
  provider?: string;
  modelId?: string;
}

export type TraceContent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string; thinkingSignature?: string }
  | { type: "toolCall"; id: string; name: string; arguments: Record<string, unknown> }
  | { type: "toolResult"; id: string; name: string; result: unknown };

export interface TraceEvent {
  type: string;
  [key: string]: unknown;
}

export interface ParsedTrace {
  session: TraceSession;
  events: TraceEvent[];
  messages: TraceMessage[];
  modelChanges: { id: string; provider: string; modelId: string }[];
  stats: {
    totalEvents: number;
    userMessages: number;
    assistantMessages: number;
    toolCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    duration: string;
  };
}