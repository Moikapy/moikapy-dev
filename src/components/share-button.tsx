"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface ShareButtonProps {
  slug: string;
  title: string;
  views?: number;
  shares?: number;
}

export function ShareButton({ slug, title, views, shares }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/blog/${slug}`;

  async function handleShare() {
    // Track the share
    fetch("/api/analytics/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: `/blog/${slug}` }),
      keepalive: true,
    }).catch(() => {});

    // Use Web Share API on mobile, copy on desktop
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or error — fall through to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {(views !== undefined || shares !== undefined) && (
        <div className="flex items-center gap-3">
          {views !== undefined && (
            <span className="flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              {views.toLocaleString()} view{views !== 1 ? "s" : ""}
            </span>
          )}
          {shares !== undefined && shares > 0 && (
            <span>
              {shares} share{shares !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Share this post"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-primary" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Share
          </>
        )}
      </button>
    </div>
  );
}