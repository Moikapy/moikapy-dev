import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, isLoginRequest, isPublicAsset, isAuthenticated } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/api/posts/:path*", "/api/auth/:path*"],
};

export async function middleware(request: NextRequest) {
  // Allow public assets through
  if (isPublicAsset(request)) {
    return NextResponse.next();
  }

  // Allow the login page itself
  if (isLoginRequest(request)) {
    return NextResponse.next();
  }

  // Allow auth API routes (login/logout handle their own auth)
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  if (!isAdminRequest(request)) {
    return NextResponse.next();
  }

  // Verify session
  const authenticated = await isAuthenticated(request);

  if (!authenticated) {
    // For API routes, return 401
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // For admin pages, redirect to login
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}