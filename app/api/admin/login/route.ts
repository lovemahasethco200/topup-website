
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  isValidAdminLogin,
} from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("email" in body) ||
      !("password" in body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email.trim() || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isValidAdminLogin(email, password)) {
      return NextResponse.json(
        { success: false, message: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    const session = createAdminSession();

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );

    response.cookies.set(ADMIN_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: session.maxAge,
    });

    return response;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Login failed. Check server configuration." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
