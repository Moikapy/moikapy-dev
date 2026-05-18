import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const SESSION_COOKIE = "moikapy_session";
// Session lasts 7 days
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// ── Password Hashing (PBKDF2 with salt) ────────────────────────

const PBKDF2_ITERATIONS = 100_000;

/**
 * Hash a password with PBKDF2-SHA256 and a random salt.
 * Returns format: pbkdf2:iterations:salt:hash
 * This replaces the old SHA-256 plain hash.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a stored hash.
 * Supports both new PBKDF2 format and legacy SHA-256 format (auto-migrates).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Legacy SHA-256 format (plain hex, 64 chars)
  if (!storedHash.startsWith("pbkdf2:")) {
    const encoder = new TextEncoder();
    const inputHash = await crypto.subtle.digest("SHA-256", encoder.encode(password));
    const inputHex = Array.from(new Uint8Array(inputHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    // Constant-time comparison
    if (inputHex.length !== storedHash.length) return false;
    let result = 0;
    for (let i = 0; i < inputHex.length; i++) {
      result |= inputHex.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
  }

  // PBKDF2 format: pbkdf2:iterations:salt:hash
  const parts = storedHash.split(":");
  if (parts.length !== 4) return false;
  const [, iterStr, saltHex, expectedHash] = parts;
  const iterations = parseInt(iterStr, 10);

  // Decode salt from hex
  const saltBytes = new Uint8Array(saltHex.length / 2);
  for (let i = 0; i < saltHex.length; i += 2) {
    saltBytes[i / 2] = parseInt(saltHex.slice(i, i + 2), 16);
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const inputHash = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (inputHash.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
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