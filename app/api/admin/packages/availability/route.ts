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
    const { packageId, active } = body;

    if (
      typeof packageId !== "string" ||
      !/^[a-f\d]{24}$/i.test(packageId) ||
      typeof active !== "boolean"
    ) {
      return NextResponse.json(
        { success: false, message: "Valid packageId and active status are required" },
        { status: 400 }
      );
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      { $set: { active } },
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: active ? "Package is now available" : "Package is now out of stock",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("PACKAGE AVAILABILITY ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update package availability" },
      { status: 500 }
    );
  }
}
