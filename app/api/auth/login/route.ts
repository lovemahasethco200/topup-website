
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSession,
} from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const identifier =
      typeof body.identifier === "string"
        ? body.identifier.trim()
        : "";

    const password =
      typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter your email or phone number and password.",
        },
        { status: 400 }
      );
    }

    if (password.length > 72 || identifier.length > 254) {
      return NextResponse.json(
        { success: false, message: "Invalid login details." },
        { status: 400 }
      );
    }

    await dbConnect();

    const isEmail = identifier.includes("@");
    const normalizedIdentifier = isEmail
      ? identifier.toLowerCase()
      : identifier;

    const user = await User.findOne(
      isEmail
        ? { email: normalizedIdentifier }
        : { phone: normalizedIdentifier }
    ).select("+passwordHash");

    // Use the same message for unknown users and wrong passwords.
    if (
      !user ||
      !user.passwordHash ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email/phone or password.",
        },
        { status: 401 }
      );
    }

    const { token, maxAge } = createCustomerSession(
      user._id.toString()
    );

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email ?? null,
        phone: user.phone ?? null,
        phoneVerified: user.phoneVerified,
        walletBalance: user.walletBalance,
      },
    });

    response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    console.error("Customer login error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in right now." },
      { status: 500 }
    );
  }
}
