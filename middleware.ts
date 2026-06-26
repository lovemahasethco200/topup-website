import { NextRequest, NextResponse } from "next/server";

const ADMIN_COOKIE_NAME =
  process.env.ADMIN_COOKIE_NAME || "topup_admin_session";
const ADMIN_COOKIE_VALUE =
  process.env.ADMIN_COOKIE_VALUE || "loggedin_topup_admin_2026";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isLoggedIn = adminCookie === ADMIN_COOKIE_VALUE;

  // -----------------------------
  // Protect /admin pages
  // -----------------------------
  if (pathname.startsWith("/admin")) {
    // allow login page itself
    if (pathname === "/admin/login") {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    // any other /admin route needs login
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};