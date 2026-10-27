
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSession,
} from "@/lib/adminAuth";

export async function requireAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (!verifyAdminSession(token)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized admin access",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    return null;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Admin session verification failed",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}