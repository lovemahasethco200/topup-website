import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Package from "@/models/Package";
import { requireAdmin } from "@/lib/adminGuard";

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { packages } = body;

    if (!Array.isArray(packages) || packages.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Invalid package order" },
        { status: 400 }
      );
    }

    const ids = packages.map((item) => String(item.id ?? ""));
    if (
      ids.some((id) => !/^[a-f\d]{24}$/i.test(id)) ||
      new Set(ids).size !== ids.length ||
      packages.some(
        (item) => !Number.isInteger(item.sortOrder) || item.sortOrder < 0
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid package order data" },
        { status: 400 }
      );
    }

    await Package.bulkWrite(
      packages.map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { $set: { sortOrder: item.sortOrder } },
        },
      }))
    );

    return NextResponse.json({ success: true, message: "Package order saved" });
  } catch (error) {
    console.error("PACKAGE REORDER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save package order" },
      { status: 500 }
    );
  }
}
