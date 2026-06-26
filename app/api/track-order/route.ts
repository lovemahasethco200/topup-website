import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!id && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Order ID or phone number is required",
        },
        { status: 400 }
      );
    }

    let order = null;

    // 1) First priority: exact order ID
    if (id) {
      order = await Order.findById(id);
    }

    // 2) If not found and phone is given, fetch latest order by phone
    if (!order && phone) {
      order = await Order.findOne({ phone }).sort({ createdAt: -1 });
    }

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "No order found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("TRACK ORDER ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order",
      },
      { status: 500 }
    );
  }
}