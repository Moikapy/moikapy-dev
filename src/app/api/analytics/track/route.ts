import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const SKIP_PREFIXES = ["/admin", "/api/", "/_next/", "/favicon"];
const SKIP_SUFFIXES = [".ico", ".png", ".jpg", ".svg", ".webmanifest", ".xml", ".css", ".js"];
const MAX_PATH_LENGTH = 500;
const MAX_REFERER_LENGTH = 2000;

function normalizeReferer(ref: string): string {
  if (!ref) return "direct";
  try {
    const url = new URL(ref);
    // Strip to hostname — no path/query details
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
}

function shouldSkip(path: string): boolean {
  if (path.length > MAX_PATH_LENGTH) return true;
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return true;
  if (SKIP_SUFFIXES.some((s) => path.endsWith(s))) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, { max: 60, windowSeconds: 60, prefix: "track" });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await request.json()) as { path?: string; ref?: string };
    const path: string | undefined = body.path;
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    // Sanitize path
    const cleanPath = path.split("?")[0].replace(/\/+$/, "").slice(0, MAX_PATH_LENGTH) || "/";
    if (shouldSkip(cleanPath)) {
      return NextResponse.json({ ok: true });
    }

    // Sanitize referrer
    const rawRef = typeof body.ref === "string" ? body.ref.slice(0, MAX_REFERER_LENGTH) : "";
    const referer = normalizeReferer(rawRef);
    const today = new Date().toISOString().split("T")[0];

    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ ok: true });
    }

    // Batch both writes into a single D1 round-trip
    await db.batch([
      db
        .prepare(
          `INSERT INTO page_views (path, date, views) VALUES (?, ?, 1)
           ON CONFLICT(path, date) DO UPDATE SET views = views + 1`
        )
        .bind(cleanPath, today),
      db
        .prepare(
          `INSERT INTO page_referrers (referer, path, date, views) VALUES (?, ?, ?, 1)
           ON CONFLICT(referer, path, date) DO UPDATE SET views = views + 1`
        )
        .bind(referer, cleanPath, today),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never block page loads
    console.error("[analytics/track] Error:", err);
    return NextResponse.json({ ok: true });
  }
}