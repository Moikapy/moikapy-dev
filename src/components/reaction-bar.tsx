"use client";

import { useState, useEffect } from "react";
import { AVAILABLE_EMOJIS, type ReactionEmoji } from "@/lib/reactions";

interface ReactionBarProps {
  slug: string;
}

interface ReactionState {
  reactions: Record<string, number>;
  myReactions: string[];
  loading: boolean;
}

export function ReactionBar({ slug }: ReactionBarProps) {
  const [state, setState] = useState<ReactionState>({
    reactions: {},
    myReactions: [],
    loading: true,
  });

  useEffect(() => {
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json() as Promise<{ reactions: Record<string, number>; myReactions: string[] }>)
      .then((data) => {
        setState({
          reactions: data.reactions || {},
          myReactions: data.myReactions || [],
          loading: false,
        });
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, [slug]);

  async function toggle(emoji: ReactionEmoji) {
    // Optimistic update
    const wasMine = state.myReactions.includes(emoji);
    const newReactions = { ...state.reactions };
    newReactions[emoji] = (newReactions[emoji] || 0) + (wasMine ? -1 : 1);
    const newMyReactions = wasMine
      ? state.myReactions.filter((e) => e !== emoji)
      : [...state.myReactions, emoji];

    setState({
      reactions: newReactions,
      myReactions: newMyReactions,
      loading: false,
    });

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, emoji }),
      });

      if (!res.ok) {
        // Revert on error
        setState((s) => ({
          ...s,
          reactions: state.reactions,
          myReactions: state.myReactions,
        }));
      }
    } catch {
      // Revert on error
      setState((s) => ({
        ...s,
        reactions: state.reactions,
        myReactions: state.myReactions,
      }));
    }
  }

  if (state.loading) {
    return (
      <div className="flex items-center gap-2">
        {AVAILABLE_EMOJIS.map((emoji) => (
          <span
            key={emoji}
            className="inline-flex h-9 min-w-[3rem] items-center justify-center rounded-full bg-muted/50 text-sm"
          >
            {emoji}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {AVAILABLE_EMOJIS.map((emoji) => {
        const count = state.reactions[emoji] || 0;
        const isMine = state.myReactions.includes(emoji);

        // Hide emojis with 0 reactions unless user has reacted
        if (count === 0 && !isMine) return null;

        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-all ${
              isMine
                ? "border-orange-500/50 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            aria-label={`React with ${emoji}${isMine ? " (click to remove)" : ""}`}
            aria-pressed={isMine}
          >
            <span className="text-base leading-none">{emoji}</span>
            {count > 0 && (
              <span className="text-xs font-medium tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}