import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";
import Package from "@/models/Package";
import { requireAdmin } from "@/lib/adminGuard";

export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { success: false, message: "gameId is required" },
        { status: 400 }
      );
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return NextResponse.json(
        { success: false, message: "Game not found" },
        { status: 404 }
      );
    }

    // delete related packages too
    await Package.deleteMany({ gameSlug: game.slug });

    await Game.findByIdAndDelete(gameId);

    return NextResponse.json({
      success: true,
      message: "Game deleted successfully",
    });
  } catch (error) {
    console.error("ADMIN GAME DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete game" },
      { status: 500 }
    );
  }
}