
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSession,
} from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const session = verifyCustomerSession(token);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.userId).select(
      "name email phone phoneVerified walletBalance isActive createdAt"
    );

    if (!user || !user.isActive) {
      const response = NextResponse.json(
        { success: false, message: "Customer account not found." },
        { status: 401 }
      );

      response.cookies.set(CUSTOMER_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email ?? null,
        phone: user.phone ?? null,
        phoneVerified: user.phoneVerified,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Customer session check error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to verify your session." },
      { status: 500 }
    );
  }
}
