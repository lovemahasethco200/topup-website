import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Package from "@/models/Package";
import { requireAdmin } from "@/lib/adminGuard";

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, message: "packageId is required" },
        { status: 400 }
      );
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    await Package.findByIdAndDelete(packageId);

    return NextResponse.json({
      success: true,
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("ADMIN PACKAGE DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete package" },
      { status: 500 }
    );
  }
}