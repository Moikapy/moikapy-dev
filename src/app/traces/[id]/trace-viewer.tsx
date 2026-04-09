"use client";

import { useState } from "react";
import type { TraceMessage, TraceContent } from "@/lib/traces";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TraceViewerProps {
  messages: TraceMessage[];
}

export function TraceViewer({ messages }: TraceViewerProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set());

  function toggleTool(id: string) {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Only show user and assistant messages (skip system/tool results for cleanliness)
  const visibleMessages = messages.filter(
    (m) => m.message?.role === "user" || m.message?.role === "assistant"
  );

  return (
    <div className="space-y-4">
      {visibleMessages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.message.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
              msg.message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium opacity-70">
                {msg.message.role === "user" ? "You" : "Assistant"}
              </span>
              {msg.modelId && msg.message.role === "assistant" && (
                <Badge variant="outline" className="text-[9px] h-4 px-1 opacity-60">
                  {msg.modelId}
                </Badge>
              )}
            </div>

            {Array.isArray(msg.message.content) ? (
              <div className="space-y-3">
                {msg.message.content.map((block, i) => (
                  <ContentBlock
                    key={`${msg.id}-${i}`}
                    block={block}
                    expanded={expandedTools.has(`${msg.id}-${i}`)}
                    onToggleTool={() => toggleTool(`${msg.id}-${i}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{String(msg.message.content)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentBlock({
  block,
  expanded,
  onToggleTool,
}: {
  block: TraceContent;
  expanded: boolean;
  onToggleTool: () => void;
}) {
  if (typeof block !== "object" || !("type" in block)) {
    return <p>{String(block)}</p>;
  }

  switch (block.type) {
    case "text":
      return (
        <p className="whitespace-pre-wrap">{block.text}</p>
      );

    case "thinking":
      return (
        <details className="rounded border border-border/50 bg-background/50">
          <summary className="cursor-pointer px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            💭 Thinking
          </summary>
          <div className="px-3 pb-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
            {block.thinking}
          </div>
        </details>
      );

    case "toolCall":
      return (
        <div className="rounded border border-border/50 bg-background/80">
          <button
            onClick={onToggleTool}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-mono text-primary">{block.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {expanded ? "▼" : "▶"}
            </span>
          </button>
          {expanded && (
            <pre className="border-t border-border/50 px-3 py-2 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(block.arguments, null, 2)}
            </pre>
          )}
        </div>
      );

    case "toolResult":
      return null; // Skip tool results in chat view

    default:
      return null;
  }
}