import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    console.log("ORDER BODY:", body);

    const {
      game,
      package: packageName,
      price,
      uid,
      nickname,
      phone,
      paymentMethod,
      transactionId,
      customerNote,
    } = body;

    if (!game || !packageName || !price || !uid || !nickname || !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required order fields",
        },
        { status: 400 }
      );
    }

    const newOrder = await Order.create({
      game: String(game).trim(),
      package: String(packageName).trim(),
      price: String(price).trim(),
      uid: String(uid).trim(),
      nickname: String(nickname).trim(),
      phone: String(phone).trim(),
      paymentMethod: paymentMethod ? String(paymentMethod).trim() : "eSewa",
      transactionId: transactionId ? String(transactionId).trim() : "",
      customerNote: customerNote ? String(customerNote).trim() : "",
      adminNote: "",
      status: "Pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        order: newOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ORDER CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to place order",
        error:
          process.env.NODE_ENV !== "production"
            ? String(error?.stack || error)
            : undefined,
      },
      { status: 500 }
    );
  }
}