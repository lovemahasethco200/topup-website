
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSession,
} from "@/lib/customerAuth";

export async function GET(req: NextRequest) {
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
    }).select("_id walletBalance");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer account not found or inactive." },
        { status: 401 }
      );
    }

    const transactions = await WalletTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select(
        "type amount paymentMethod transactionReference status adminNote reviewedAt createdAt"
      )
      .lean();

    return NextResponse.json({
      success: true,
      walletBalance: Number(user.walletBalance || 0),
      transactions: transactions.map((transaction) => ({
        id: String(transaction._id),
        type: transaction.type,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        transactionReference: transaction.transactionReference,
        status: transaction.status,
        adminNote: transaction.adminNote,
        reviewedAt: transaction.reviewedAt,
        createdAt: transaction.createdAt,
      })),
    });
  } catch (error) {
    console.error("WALLET HISTORY ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load wallet information." },
      { status: 500 }
    );
  }
}
