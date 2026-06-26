import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const orderId = body.orderId?.trim();

    if (!orderId) {
      return Response.json(
        {
          success: false,
          message: "Order ID is required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return Response.json(
        {
          success: false,
          message: "Invalid order ID",
        },
        { status: 400 }
      );
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Processing" },
      { new: true }
    );

    if (!updatedOrder) {
      return Response.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: "Order marked as Processing",
      order: updatedOrder,
    });
  } catch (error) {
    console.log("PAYMENT SUCCESS API ERROR:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update payment success",
      },
      { status: 500 }
    );
  }
}