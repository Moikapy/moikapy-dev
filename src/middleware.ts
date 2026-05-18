import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, isLoginRequest, isPublicAsset, isAuthenticated } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/api/posts/:path*", "/api/auth/:path*", "/api/knowledge", "/api/ai/:path*", "/api/admin/:path*"],
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0"); // Modern approach: let browsers handle XSS natively
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
  response.headers.delete("X-Powered-By");
  return response;
}

export async function middleware(request: NextRequest) {
  // Allow public assets through
  if (isPublicAsset(request)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Allow the login page itself
  if (isLoginRequest(request)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Allow auth API routes (login/logout handle their own auth)
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return withSecurityHeaders(NextResponse.next());
  }

  // AI routes require auth regardless of method
  if (request.nextUrl.pathname.startsWith("/api/ai/")) {
    // Allow cron triggers with Cf-Auth-Token (Cloudflare cron auth)
    let isCron = false;
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      const cronSecret = ctx.env.CRON_SECRET as string | undefined;
      isCron = !!cronSecret && request.headers.get("Cf-Auth-Token") === cronSecret;
    } catch {
      // Not in CF context — cron auth unavailable
    }
    if (isCron) {
      return withSecurityHeaders(NextResponse.next());
    }
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // Check if this is a protected route
  if (!isAdminRequest(request)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Verify session
  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    // For API routes, return 401
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    // For admin pages, redirect to login
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/admin/login", request.url))
    );
  }

  return withSecurityHeaders(NextResponse.next());
}