import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Package from "@/models/Package";
import Game from "@/models/Game";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const packages = await Package.find({})
      .sort({ gameSlug: 1, sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, packages });
  } catch (error) {
    console.error("ADMIN PACKAGES GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await dbConnect();

    const body = await req.json();
    const { gameSlug, name, price, bonus, category } = body;

    if (!gameSlug || !name || !String(price ?? "").trim()) {
      return NextResponse.json(
        { success: false, message: "gameSlug, name and price are required" },
        { status: 400 }
      );
    }

    const game = await Game.findOne({ slug: String(gameSlug).trim() });
    if (!game) {
      return NextResponse.json(
        { success: false, message: "Selected game not found" },
        { status: 404 }
      );
    }

    const lastPackage = await Package.findOne({ gameSlug: game.slug })
      .sort({ sortOrder: -1, createdAt: -1 })
      .select("sortOrder")
      .lean();

    const pkg = await Package.create({
      gameSlug: game.slug,
      gameName: game.name,
      name: String(name).trim(),
      category: category ? String(category).trim() : "General",
      price: String(price).trim(),
      bonus: bonus ? String(bonus).trim() : "",
      active: true,
      sortOrder: (lastPackage?.sortOrder ?? -1) + 1,
    });

    return NextResponse.json({
      success: true,
      message: "Package added successfully",
      package: pkg,
    });
  } catch (error) {
    console.error("ADMIN PACKAGE CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add package" },
      { status: 500 }
    );
  }
}
