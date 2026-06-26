import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";
import { requireAdmin } from "@/lib/adminGuard";

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { gameId, name, slug, desc, image } = body;

    if (!gameId) {
      return NextResponse.json(
        { success: false, message: "gameId is required" },
        { status: 400 }
      );
    }

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    const existingSlug = await Game.findOne({
      slug: slug.trim(),
      _id: { $ne: gameId },
    });

    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: "Another game already uses this slug" },
        { status: 400 }
      );
    }

    const updatedGame = await Game.findByIdAndUpdate(
      gameId,
      {
        name: String(name).trim(),
        slug: String(slug).trim(),
        desc: desc ? String(desc).trim() : "",
        image: image ? String(image).trim() : "",
      },
      { new: true }
    );

    if (!updatedGame) {
      return NextResponse.json(
        { success: false, message: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Game updated successfully",
      game: updatedGame,
    });
  } catch (error) {
    console.error("ADMIN GAME UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update game" },
      { status: 500 }
    );
  }
}