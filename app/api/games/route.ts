import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";

export async function GET() {
  try {
    await dbConnect();

    const games = await Game.find({ active: true }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch games",
      },
      { status: 500 }
    );
  }
}