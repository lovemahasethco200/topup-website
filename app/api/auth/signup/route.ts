
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, message: "Name is too long." },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter an email address or phone number.",
        },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (phone && !/^\+?[0-9]{7,15}$/.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid phone number with country code if needed.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be 8–72 characters long.",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const conditions = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });

    const existingUser = await User.findOne({
      $or: conditions,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email or phone already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData: {
      name: string;
      passwordHash: string;
      email?: string;
      phone?: string;
    } = {
      name,
      passwordHash,
    };

    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = await User.create(userData);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email ?? null,
          phone: user.phone ?? null,
          phoneVerified: user.phoneVerified,
          walletBalance: user.walletBalance,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This email or phone is already registered.",
        },
        { status: 409 }
      );
    }

    console.error("Customer signup error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create account right now." },
      { status: 500 }
    );
  }
}
