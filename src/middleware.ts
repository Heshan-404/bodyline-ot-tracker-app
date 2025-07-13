import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Redirect authenticated users from /login to /dashboard
    if (req.nextUrl.pathname === "/login" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect dashboard routes
    if (req.nextUrl.pathname.startsWith("/dashboard") && !req.nextauth.token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect receipts routes (except create for HR, handled by API route)
    if (req.nextUrl.pathname.startsWith("/receipts") && !req.nextauth.token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Allow access to API routes for authentication
    if (req.nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Allow access to API routes for receipts and users (handled by API route logic)
    if (req.nextUrl.pathname.startsWith("/api/receipts") || req.nextUrl.pathname.startsWith("/api/users")) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to /login for unauthenticated users
        if (req.nextUrl.pathname === "/login") {
          return true;
        }
        // Allow access to API routes for authentication
        if (req.nextUrl.pathname.startsWith("/api/auth")) {
          return true;
        }
        // For all other routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};