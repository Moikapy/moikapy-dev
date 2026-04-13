import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const SKIP_PREFIXES = ["/admin", "/api/", "/_next/", "/favicon"];
const SKIP_SUFFIXES = [".ico", ".png", ".jpg", ".svg", ".webmanifest", ".xml", ".css", ".js"];

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
  if (path.length > 500) return true;
  if (SKIP_PREFIXES.some((p) => path.startsWith(p))) return true;
  if (SKIP_SUFFIXES.some((s) => path.endsWith(s))) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { path?: string; ref?: string };
    const path: string | undefined = body.path;
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/";
    if (shouldSkip(cleanPath)) {
      return NextResponse.json({ ok: true });
    }

    const referer = normalizeReferer(body.ref || "");
    const today = new Date().toISOString().split("T")[0];

    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ ok: true });
    }

    // Fire and forget — don't block the response
    const pageViewPromise = db
      .prepare(
        `INSERT INTO page_views (path, date, views) VALUES (?, ?, 1)
         ON CONFLICT(path, date) DO UPDATE SET views = views + 1`
      )
      .bind(cleanPath, today)
      .run();

    const referrerPromise = db
      .prepare(
        `INSERT INTO page_referrers (referer, path, date, views) VALUES (?, ?, ?, 1)
         ON CONFLICT(referer, path, date) DO UPDATE SET views = views + 1`
      )
      .bind(referer, cleanPath, today)
      .run();

    // Wait for both but don't let errors block
    await Promise.allSettled([pageViewPromise, referrerPromise]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never block page loads
    console.error("[analytics/track] Error:", err);
    return NextResponse.json({ ok: true });
  }
}