
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import { requireAdmin } from "@/lib/adminGuard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

class DepositReviewError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "DepositReviewError";
    this.statusCode = statusCode;
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let session: mongoose.ClientSession | undefined;

  try {
    await dbConnect();

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid deposit ID." },
        { status: 400 }
      );
    }

    let body: { status?: unknown; adminNote?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const decision = body.status;

    if (decision !== "Approved" && decision !== "Rejected") {
      return NextResponse.json(
        {
          success: false,
          message: 'Status must be "Approved" or "Rejected".',
        },
        { status: 400 }
      );
    }

    const adminNote =
      typeof body.adminNote === "string"
        ? body.adminNote.trim()
        : "";

    if (adminNote.length > 500) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin note must be 500 characters or fewer.",
        },
        { status: 400 }
      );
    }

    session = await mongoose.startSession();

    let result:
      | {
          id: string;
          status: "Approved" | "Rejected";
          amount: number;
          walletBalance?: number;
        }
      | undefined;

    await session.withTransaction(async () => {
      // Only a Pending deposit can be reviewed.
      // This condition prevents a second approval from crediting again.
      const deposit = await WalletTransaction.findOneAndUpdate(
        {
          _id: id,
          type: "deposit",
          status: "Pending",
        },
        {
          $set: {
            status: decision,
            adminNote,
            reviewedAt: new Date(),
            reviewedBy: "admin",
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!deposit) {
        throw new DepositReviewError(
          "Deposit not found or already reviewed. Refresh the deposit list.",
          409
        );
      }

      let walletBalance: number | undefined;

      if (decision === "Approved") {
        const user = await User.findOneAndUpdate(
          {
            _id: deposit.userId,
            isActive: true,
          },
          {
            $inc: { walletBalance: deposit.amount },
          },
          {
            new: true,
            session,
            runValidators: true,
          }
        ).select("walletBalance");

        if (!user) {
          throw new DepositReviewError(
            "Customer not found or inactive. No changes were saved.",
            409
          );
        }

        walletBalance = Number(user.walletBalance || 0);
      }

      result = {
        id: String(deposit._id),
        status: decision,
        amount: deposit.amount,
        ...(walletBalance !== undefined ? { walletBalance } : {}),
      };
    });

    if (!result) {
      throw new Error("Deposit review did not complete.");
    }

    return NextResponse.json({
      success: true,
      message:
        decision === "Approved"
          ? "Deposit approved and wallet credited successfully."
          : "Deposit rejected. Wallet balance was not changed.",
      deposit: result,
    });
  } catch (error) {
    if (error instanceof DepositReviewError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    console.error("ADMIN WALLET DEPOSIT REVIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to review deposit. No successful approval was confirmed. Check the deposit status before retrying.",
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
