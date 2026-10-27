
import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/mongodb";
import WalletTransaction from "@/models/WalletTransaction";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {
      type: "deposit",
    };

    if (status && status !== "All") {
      if (!["Pending", "Approved", "Rejected"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid deposit status." },
          { status: 400 }
        );
      }

      query.status = status;
    }

    const deposits = await WalletTransaction.find(query)
      .populate({
        path: "userId",
        select: "name email phone",
      })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const formattedDeposits = deposits.map((deposit) => {
      const customer =
        deposit.userId &&
        typeof deposit.userId === "object" &&
        "name" in deposit.userId
          ? deposit.userId
          : null;

      return {
        id: String(deposit._id),
        amount: deposit.amount,
        paymentMethod: deposit.paymentMethod,
        transactionReference: deposit.transactionReference,
        status: deposit.status,
        adminNote: deposit.adminNote,
        reviewedAt: deposit.reviewedAt,
        reviewedBy: deposit.reviewedBy,
        createdAt: deposit.createdAt,
        customer: customer
          ? {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            }
          : null,
        userId:
          deposit.userId && typeof deposit.userId === "object"
            ? String(
                "_id" in deposit.userId
                  ? deposit.userId._id
                  : deposit.userId
              )
            : String(deposit.userId),
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedDeposits.length,
      deposits: formattedDeposits,
    });
  } catch (error) {
    console.error("ADMIN WALLET DEPOSITS GET ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch wallet deposits." },
      { status: 500 }
    );
  }
}
