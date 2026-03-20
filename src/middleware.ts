import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that don't require authentication
const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/check"];

// Paths that should skip CSRF verification
const csrfSkipPaths = [
  "/api/auth/login",
  "/api/auth/logout", 
  "/api/auth/check",
  "/api/auth/change-password",
  "/api/settings",
  "/api/health"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token from cookies
  const authToken = request.cookies.get("auth-token");
  const isAuthenticated = !!authToken?.value;

  // If user is authenticated and trying to access login page, redirect to dashboard
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and trying to access protected routes
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is not authenticated and trying to access root, redirect to login
  if (!isAuthenticated && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is authenticated and at root, redirect to dashboard
  if (isAuthenticated && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow public paths and API routes
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
