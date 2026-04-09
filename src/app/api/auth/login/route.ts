import { NextRequest, NextResponse } from "next/server";
import { handleLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleLogin(request);
}