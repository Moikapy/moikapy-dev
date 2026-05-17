import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (resets on deploy, fine for edge Workers)
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Max requests per window */
  max: number;
  /** Window in seconds */
  windowSeconds: number;
  /** Key prefix */
  prefix?: string;
}

/**
 * In-memory rate limiter. Returns null if allowed, or a NextResponse with 429 if rate limited.
 * Uses IP-based identification via cf-connecting-ip or x-forwarded-for.
 */
export function rateLimit(request: NextRequest, options: RateLimitOptions): NextResponse | null {
  cleanup();

  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";

  const key = `${options.prefix || "rl"}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return null;
  }

  if (entry.count >= options.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  entry.count++;
  return null;
}