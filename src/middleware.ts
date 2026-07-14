import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const { token } = req.nextauth;
    const pathname = req.nextUrl.pathname;

    // ── ADMIN ROUTES ────────────────────────────────────────────
    // All /admin/* except /admin/login require an admin-role token
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (!token) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      if (token.role !== "admin") {
        // Non-admin user attempting to access admin area → send to their dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // ── DASHBOARD ROUTES ────────────────────────────────────────
    // /dashboard/* requires an authenticated non-admin session
    if (pathname.startsWith("/dashboard")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Admin users must never access the user dashboard
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes — always allow through
        if (
          pathname === "/login" ||
          pathname === "/register" ||
          pathname === "/admin/login" ||
          pathname === "/forgot-password" ||
          pathname === "/" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon")
        ) {
          return true;
        }

        // All other routes (dashboard, admin) require a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
