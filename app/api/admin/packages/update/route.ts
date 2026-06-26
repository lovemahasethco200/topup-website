import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Package from "@/models/Package";
import Game from "@/models/Game";
import { requireAdmin } from "@/lib/adminGuard";

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { packageId, gameSlug, name, price, bonus } = body;

    if (!packageId) {
      return NextResponse.json(
        { success: false, message: "packageId is required" },
        { status: 400 }
      );
    }

    if (!gameSlug || !name || !price) {
      return NextResponse.json(
        { success: false, message: "gameSlug, name and price are required" },
        { status: 400 }
      );
    }

    const game = await Game.findOne({ slug: gameSlug.trim() });
    if (!game) {
      return NextResponse.json(
        { success: false, message: "Selected game not found" },
        { status: 404 }
      );
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      {
        gameSlug: game.slug,
        gameName: game.name,
        name: String(name).trim(),
        price: String(price).trim(),
        bonus: bonus ? String(bonus).trim() : "",
      },
      { new: true }
    );

    if (!updatedPackage) {
      return NextResponse.json(
        { success: false, message: "Package not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("ADMIN PACKAGE UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update package" },
      { status: 500 }
    );
  }
}