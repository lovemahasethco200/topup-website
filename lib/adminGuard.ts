import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE } from "@/lib/adminAuth";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!adminCookie || adminCookie !== ADMIN_COOKIE_VALUE) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized admin access",
      },
      { status: 401 }
    );
  }

  return null;
}