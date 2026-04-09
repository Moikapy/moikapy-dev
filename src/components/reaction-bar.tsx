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
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json() as Promise<{ reactions: Record<string, number>; myReactions: string[] }>)
      .then((data) => {
        setState({
          reactions: data.reactions || {},
          myReactions: state.myReactions.length ? state.myReactions : (data.myReactions || []),
          loading: false,
        });
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
    // Only fetch on mount, not on every myReactions change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function toggle(emoji: ReactionEmoji) {
    const wasMine = state.myReactions.includes(emoji);
    const newReactions = { ...state.reactions };
    newReactions[emoji] = Math.max(0, (newReactions[emoji] || 0) + (wasMine ? -1 : 1));
    const newMyReactions = wasMine
      ? state.myReactions.filter((e) => e !== emoji)
      : [...state.myReactions, emoji];

    // Close picker after selecting
    setPickerOpen(false);

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
        setState((s) => ({ ...s, reactions: state.reactions, myReactions: state.myReactions }));
      }
    } catch {
      setState((s) => ({ ...s, reactions: state.reactions, myReactions: state.myReactions }));
    }
  }

  if (state.loading) {
    return (
      <div className="h-10 animate-pulse rounded-lg bg-muted/30" />
    );
  }

  // Active reactions: ones with count > 0 or that user has selected
  const activeEmojis = AVAILABLE_EMOJIS.filter(
    (emoji) => (state.reactions[emoji] || 0) > 0 || state.myReactions.includes(emoji)
  );
  const hasReactions = activeEmojis.length > 0;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        How did this post make you feel?
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        {/* Active reaction chips */}
        {activeEmojis.map((emoji) => {
          const count = state.reactions[emoji] || 0;
          const isMine = state.myReactions.includes(emoji);

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

        {/* Add reaction button */}
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-all ${
            pickerOpen
              ? "border-orange-500/50 bg-orange-500/10 text-orange-500"
              : hasReactions
                ? "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
          aria-label="Add reaction"
        >
          {pickerOpen ? (
            <span className="text-base leading-none">✕</span>
          ) : (
            <>
              <span className="text-base leading-none">+</span>
              {!hasReactions && (
                <span className="text-xs">React</span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Emoji picker — expands below */}
      {pickerOpen && (
        <div className="mt-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          {AVAILABLE_EMOJIS.map((emoji) => {
            const isMine = state.myReactions.includes(emoji);
            return (
              <button
                key={emoji}
                onClick={() => toggle(emoji)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition-all hover:scale-110 ${
                  isMine
                    ? "border-orange-500/50 bg-orange-500/10"
                    : "border-border/50 bg-card hover:bg-muted/50"
                }`}
                aria-label={`React with ${emoji}${isMine ? " (click to remove)" : ""}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}