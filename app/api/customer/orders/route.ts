
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSession,
} from "@/lib/customerAuth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const session = verifyCustomerSession(token);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in to view your orders." },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({
      _id: session.userId,
      isActive: true,
    }).select("_id");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Customer account not found." },
        { status: 401 }
      );
    }

    const orders = await Order.find({ userId: user._id })
      .select("game package price status createdAt paymentMethod")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      orders: orders.map((order: any) => ({
        id: order._id.toString(),
        game: order.game,
        package: order.package,
        price: order.price,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("CUSTOMER ORDERS ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Unable to load orders right now." },
      { status: 500 }
    );
  }
}
