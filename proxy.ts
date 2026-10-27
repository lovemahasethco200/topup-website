import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME =
  process.env.ADMIN_COOKIE_NAME || "topup_admin_session";

async function verifySession(token?: string): Promise<boolean> {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, expiryText, signature] = parts;

  if (version !== "v1" || !/^\d+$/.test(expiryText)) return false;

  const expiresAt = Number(expiryText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const payload = `${version}.${expiryText}`;
    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBytes))
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    return expectedSignature === signature;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const isLoggedIn = await verifySession(token);

  if (pathname === "/admin/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
