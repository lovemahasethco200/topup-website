
import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import WalletRedeemCode from "@/models/WalletRedeemCode";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSession,
} from "@/lib/customerAuth";

class RedeemError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RedeemError";
    this.statusCode = statusCode;
  }
}

export async function POST(req: NextRequest) {
  let session: mongoose.ClientSession | undefined;

  try {
    await dbConnect();

    // Authenticate the customer.
    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerSession = verifyCustomerSession(token);

    if (
      !customerSession?.userId ||
      !mongoose.isValidObjectId(customerSession.userId)
    ) {
      return NextResponse.json(
        { success: false, message: "Please log in to redeem a code." },
        { status: 401 }
      );
    }

    // Validate request body.
    let body: { code?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    if (typeof body.code !== "string") {
      return NextResponse.json(
        { success: false, message: "Please enter a valid redeem code." },
        { status: 400 }
      );
    }

    const code = body.code.trim().toUpperCase();

    if (
      code.length < 6 ||
      code.length > 100 ||
      !/^[A-Z0-9-]+$/.test(code)
    ) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid redeem code." },
        { status: 400 }
      );
    }

    const codeHash = createHash("sha256")
      .update(code, "utf8")
      .digest("hex");

    session = await mongoose.startSession();

    let result:
      | {
          amount: number;
          walletBalance: number;
        }
      | undefined;

    await session.withTransaction(async () => {
      const user = await User.findOne({
        _id: customerSession.userId,
        isActive: true,
      })
        .select("_id walletBalance")
        .session(session!);

      if (!user) {
        throw new RedeemError(
          "Your account was not found or is inactive.",
          401
        );
      }

      const now = new Date();

      // Only an active, unused, non-expired code can be claimed.
      const redeemCode = await WalletRedeemCode.findOneAndUpdate(
        {
          codeHash,
          status: "Active",
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        },
        {
          $set: {
            status: "Redeemed",
            redeemedBy: user._id,
            redeemedAt: now,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!redeemCode) {
        throw new RedeemError(
          "This code is invalid, expired, disabled, or already redeemed.",
          400
        );
      }

      const updatedUser = await User.findOneAndUpdate(
        {
          _id: user._id,
          isActive: true,
        },
        {
          $inc: { walletBalance: redeemCode.amount },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      ).select("walletBalance");

      if (!updatedUser) {
        throw new RedeemError(
          "Unable to update your wallet. No changes were saved.",
          409
        );
      }

      // Record the credit in wallet history.
      // The existing schema requires a paymentMethod and reference.
      await WalletTransaction.create(
        [
          {
            userId: user._id,
            type: "adjustment",
            amount: redeemCode.amount,
            paymentMethod: "Other",
            transactionReference: `REDEEM-${String(redeemCode._id)}`,
            status: "Approved",
            adminNote: "Wallet credited through a redeem code.",
            reviewedAt: now,
            reviewedBy: "system",
          },
        ],
        { session }
      );

      result = {
        amount: redeemCode.amount,
        walletBalance: Number(updatedUser.walletBalance || 0),
      };
    });

    if (!result) {
      throw new Error("Code redemption did not complete.");
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added Rs. ${result.amount} to your wallet.`,
      amount: result.amount,
      walletBalance: result.walletBalance,
    });
  } catch (error) {
    if (error instanceof RedeemError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("WALLET REDEEM ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to redeem this code right now. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
