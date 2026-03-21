import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only these paths are public (no auth needed)
const publicPaths = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/check",
  "/api/auth/change-password",
];

// API routes that skip auth check
const publicApiPaths = [
  "/api/auth/",
  "/api/webhook/",
  "/api/settings",
  "/api/health",
  "/api/projects",
  "/api/tasks",
  "/api/ideas",
  "/api/chat/",
  "/api/csrf-token",
  "/api/agents",
  "/api/self-dev/",
  "/api/notifications",
  "/api/execution-log",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and images
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth-token");
  const isAuthenticated = !!authToken?.value;

  // Allow public API paths
  if (publicApiPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow public pages
  if (publicPaths.includes(pathname)) {
    // If already authenticated, redirect away from login
    if (pathname === "/login" && isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // All other routes require auth
  if (!isAuthenticated) {
    // Save the original URL to redirect back after login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
