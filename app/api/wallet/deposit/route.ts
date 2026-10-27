
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSession,
} from "@/lib/customerAuth";

const PAYMENT_METHODS = [
  "eSewa",
  "Khalti",
  "Bank Transfer",
  "Other",
] as const;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const sessionCookie = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const session = await verifyCustomerSession(sessionCookie);

    if (!session?.userId || !mongoose.isValidObjectId(session.userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid session. Please log in again." },
        { status: 401 }
      );
    }

    const user = await User.findOne({
      _id: session.userId,
      isActive: true,
    }).select("_id");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer account not found or inactive." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const amount = Number(body.amount);
    const paymentMethod = body.paymentMethod;
    const transactionReference =
      typeof body.transactionReference === "string"
        ? body.transactionReference.trim()
        : "";

    if (
      !Number.isFinite(amount) ||
      !Number.isSafeInteger(amount) ||
      amount < 10 ||
      amount > 100000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be a whole number between Rs. 10 and Rs. 100,000.",
        },
        { status: 400 }
      );
    }

    if (
      typeof paymentMethod !== "string" ||
      !PAYMENT_METHODS.includes(
        paymentMethod as (typeof PAYMENT_METHODS)[number]
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Select a valid payment method." },
        { status: 400 }
      );
    }

    if (
      transactionReference.length < 3 ||
      transactionReference.length > 150
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid payment transaction reference.",
        },
        { status: 400 }
      );
    }

    const duplicate = await WalletTransaction.findOne({
      paymentMethod,
      transactionReference,
    }).select("_id");

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment reference has already been submitted.",
        },
        { status: 409 }
      );
    }

    const deposit = await WalletTransaction.create({
      userId: user._id,
      type: "deposit",
      amount,
      paymentMethod,
      transactionReference,
      status: "Pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Deposit request submitted. Your wallet will be credited after payment verification.",
        deposit: {
          id: deposit._id.toString(),
          amount: deposit.amount,
          paymentMethod: deposit.paymentMethod,
          transactionReference: deposit.transactionReference,
          status: deposit.status,
          createdAt: deposit.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("WALLET DEPOSIT ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to submit deposit request." },
      { status: 500 }
    );
  }
}
