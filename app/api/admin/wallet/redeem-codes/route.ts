
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import WalletRedeemCode from "@/models/WalletRedeemCode";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const codes = await WalletRedeemCode.find({})
      .select("-codeHash")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      codes: codes.map((item) => ({
        id: String(item._id),
        amount: item.amount,
        status: item.status,
        expiresAt: item.expiresAt,
        redeemedAt: item.redeemedAt,
        redeemedBy: item.redeemedBy
          ? String(item.redeemedBy)
          : null,
        createdAt: item.createdAt,
        adminNote: item.adminNote,
      })),
    });
  } catch (error) {
    console.error("ADMIN REDEEM CODE LIST ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load redeem codes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    let body: {
      amount?: unknown;
      quantity?: unknown;
      expiresAt?: unknown;
      adminNote?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const amount = body.amount;
    const quantity = body.quantity ?? 1;

    if (
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 100000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be a whole number from Rs. 1 to Rs. 100,000.",
        },
        { status: 400 }
      );
    }

    if (
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Quantity must be a whole number from 1 to 100.",
        },
        { status: 400 }
      );
    }

    let expiresAt: Date | null = null;

    if (body.expiresAt !== undefined && body.expiresAt !== null && body.expiresAt !== "") {
      if (typeof body.expiresAt !== "string") {
        return NextResponse.json(
          { success: false, message: "Invalid expiry date." },
          { status: 400 }
        );
      }

      const parsedDate = new Date(body.expiresAt);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { success: false, message: "Expiry date must be in the future." },
          { status: 400 }
        );
      }

      expiresAt = parsedDate;
    }

    const adminNote =
      typeof body.adminNote === "string" ? body.adminNote.trim() : "";

    if (adminNote.length > 500) {
      return NextResponse.json(
        { success: false, message: "Admin note must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    const generatedCodes: {
      code: string;
      amount: number;
      expiresAt: Date | null;
    }[] = [];

    // Generate high-entropy codes and store only their hashes.
    for (let i = 0; i < quantity; i++) {
      const code = `TOPUP-${randomBytes(12).toString("hex").toUpperCase()}`;
      const codeHash = createHash("sha256")
        .update(code, "utf8")
        .digest("hex");

      await WalletRedeemCode.create({
        codeHash,
        amount,
        status: "Active",
        expiresAt,
        adminNote,
        createdBy: "admin",
      });

      generatedCodes.push({ code, amount, expiresAt });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Generated ${generatedCodes.length} redeem code(s). Save these codes now; they cannot be retrieved later.`,
        codes: generatedCodes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN REDEEM CODE GENERATION ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to generate redeem codes." },
      { status: 500 }
    );
  }
}
