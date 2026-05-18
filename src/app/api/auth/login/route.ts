import { NextRequest, NextResponse } from "next/server";
import { handleLogin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, { max: 5, windowSeconds: 60, prefix: "login" });
  if (rateLimited) return rateLimited;
  return handleLogin(request);
}