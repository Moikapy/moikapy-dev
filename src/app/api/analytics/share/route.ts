import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_PATH_LENGTH = 500;

function shouldSkip(path: string): boolean {
  if (path.length > MAX_PATH_LENGTH) return true;
  if (!path.startsWith("/blog/")) return true;
  return false;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, { max: 30, windowSeconds: 60, prefix: "share" });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await request.json()) as { path?: string; platform?: string };
    const path: string | undefined = body.path;
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    const cleanPath = path.split("?")[0].replace(/\/+$/, "").slice(0, MAX_PATH_LENGTH) || "/";
    if (shouldSkip(cleanPath)) {
      return NextResponse.json({ ok: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const { env } = getCloudflareContext();
    const db = env.DB;
    if (!db) {
      return NextResponse.json({ ok: true });
    }

    await db
      .prepare(
        `INSERT INTO page_shares (path, date, shares) VALUES (?, ?, 1)
         ON CONFLICT(path, date) DO UPDATE SET shares = shares + 1`
      )
      .bind(cleanPath, today)
      .run();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[analytics/share] Error:", err);
    return NextResponse.json({ ok: true });
  }
}