import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // List of public paths that anyone can view without logging in
  const publicPaths = ["/", "/about", "/login", "/registration"];

  // Check if the current path starts with or matches a public route
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(path))
  );

  // Check if user is logged in by looking for your auth cookie or localStorage flag
  // (Note: In middleware, we read cookies. We can set a cookie named 'is_logged_in' upon successful login)
  const isLoggedIn = request.cookies.get("is_logged_in")?.value === "true";

  // If the page is NOT public and the user is NOT logged in, redirect them to /login
  if (!isPublicPath && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};