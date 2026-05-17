import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { pruneAnalytics } from "@/lib/data-retention";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const authed = await isAuthenticated(request);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await pruneAnalytics();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Prune failed:", err);
    return NextResponse.json({ error: "Prune failed" }, { status: 500 });
  }
}