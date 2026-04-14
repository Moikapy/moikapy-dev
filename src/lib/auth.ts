import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const SESSION_COOKIE = "moikapy_session";
// Session lasts 7 days
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  // Constant-time comparison
  if (inputHash.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

async function createSessionToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const timestamp = Date.now().toString(36);
  const payload = `${timestamp}:${crypto.randomUUID()}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // token = payload.signature
  return `${payload}.${sigHex}`;
}

async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const sigHex = token.slice(dotIndex + 1);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = new Uint8Array(sigHex.length / 2);
    for (let i = 0; i < sigHex.length; i += 2) {
      sigBytes[i / 2] = parseInt(sigHex.slice(i, i + 2), 16);
    }
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));

    if (!valid) return false;

    // Check expiry
    const timestamp = parseInt(payload.split(":")[0], 36);
    const age = Date.now() - timestamp;
    return age < SESSION_MAX_AGE * 1000;
  } catch {
    return false;
  }
}

export function isAdminRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  // Admin pages always require auth
  if (pathname.startsWith("/admin")) return true;
  // API write operations require auth
  if (pathname.startsWith("/api/posts") && request.method !== "GET") return true;
  // Everything else is publicly readable (x402 handles payment for external consumers)
  return false;
}

export function isLoginRequest(request: NextRequest): boolean {
  return request.nextUrl.pathname === "/admin/login";
}

export function isPublicAsset(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".ico")
  );
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  let secret: string | undefined;
  try {
    const ctx = getCloudflareContext();
    secret = ctx.env.SESSION_SECRET as string | undefined;
  } catch {
    // local dev fallback
    secret = process.env.SESSION_SECRET;
  }
  if (!secret) return false;

  return verifySessionToken(token, secret);
}

export async function handleLogin(request: NextRequest): Promise<NextResponse> {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json() as { password?: string };
  const password = body.password;

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  let expectedHash: string | undefined;
  try {
    const ctx = getCloudflareContext();
    expectedHash = ctx.env.ADMIN_PASSWORD_HASH as string | undefined;
  } catch {
    // local dev fallback
    expectedHash = process.env.ADMIN_PASSWORD_HASH;
  }
  if (!expectedHash) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  const valid = await verifyPassword(password, expectedHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  let secret: string | undefined;
  try {
    const ctx = getCloudflareContext();
    secret = ctx.env.SESSION_SECRET as string | undefined;
  } catch {
    // local dev fallback
    secret = process.env.SESSION_SECRET;
  }
  if (!secret) {
    return NextResponse.json({ error: "Session not configured" }, { status: 500 });
  }

  const token = await createSessionToken(secret);

  const isDev = process.env.NODE_ENV !== "production";
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return response;
}

export function handleLogout(request?: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  const response = NextResponse.redirect(new URL("/admin/login", request?.url || "https://moikapy.dev"));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}