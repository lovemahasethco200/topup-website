import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";
import { requireAdmin } from "@/lib/adminGuard";

// GET all games
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const games = await Game.find({}).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error("ADMIN GAMES GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

// CREATE new game
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { name, slug, desc, image } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    const existing = await Game.findOne({ slug: slug.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Game slug already exists" },
        { status: 400 }
      );
    }

    const game = await Game.create({
      name: String(name).trim(),
      slug: String(slug).trim(),
      desc: desc ? String(desc).trim() : "",
      image: image ? String(image).trim() : "",
    });

    return NextResponse.json({
      success: true,
      message: "Game added successfully",
      game,
    });
  } catch (error) {
    console.error("ADMIN GAME CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add game" },
      { status: 500 }
    );
  }
}