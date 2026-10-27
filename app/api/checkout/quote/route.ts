
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";
import PackageModel from "@/models/Package";

export const runtime = "nodejs";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function priceToNumber(value: unknown): number | null {
  const cleaned = String(value ?? "").replace(/,/g, "");
  const match = cleaned.match(/\d+(?:\.\d+)?/);

  if (!match) return null;

  const amount = Number(match[0]);

  if (!Number.isSafeInteger(amount) || amount < 1) {
    return null;
  }

  return amount;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const gameName = String(body.game ?? "").trim();
    const requestedItems = body.items;

    if (
      !gameName ||
      !Array.isArray(requestedItems) ||
      requestedItems.length < 1 ||
      requestedItems.length > 50
    ) {
      return NextResponse.json(
        { success: false, message: "Select at least one valid package." },
        { status: 400 }
      );
    }

    const escapedGameName = escapeRegex(gameName);

    const game = await Game.findOne({
      active: true,
      $or: [
        { name: { $regex: `^${escapedGameName}$`, $options: "i" } },
        { slug: { $regex: `^${escapedGameName}$`, $options: "i" } },
      ],
    }).lean();

    if (!game) {
      return NextResponse.json(
        { success: false, message: "This game is unavailable." },
        { status: 400 }
      );
    }

    const quantities = new Map<string, number>();

    for (const item of requestedItems) {
      const packageId = String(item?.packageId ?? "");
      const quantity = Number(item?.quantity);

      if (
        !mongoose.isValidObjectId(packageId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99 ||
        quantities.has(packageId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "One or more selected packages are invalid.",
          },
          { status: 400 }
        );
      }

      quantities.set(packageId, quantity);
    }

    const packageIds = [...quantities.keys()].map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const records = await PackageModel.find({
      _id: { $in: packageIds },
      gameSlug: game.slug,
      active: true,
    }).lean();

    if (records.length !== quantities.size) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A selected package is unavailable. Return and select packages again.",
        },
        { status: 400 }
      );
    }

    const items = [];
    let total = 0;

    for (const record of records) {
      const packageId = record._id.toString();
      const quantity = quantities.get(packageId) ?? 0;
      const unitPrice = priceToNumber(record.price);

      if (!quantity || unitPrice === null) {
        return NextResponse.json(
          {
            success: false,
            message: "A selected package has an invalid price.",
          },
          { status: 400 }
        );
      }

      const subtotal = unitPrice * quantity;

      if (!Number.isSafeInteger(subtotal)) {
        return NextResponse.json(
          { success: false, message: "Order total is too large." },
          { status: 400 }
        );
      }

      total += subtotal;

      items.push({
        packageId,
        packageName: record.name,
        quantity,
        unitPrice,
        subtotal,
      });
    }

    if (!Number.isSafeInteger(total) || total < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid order total." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      game: game.name,
      items,
      total,
    });
  } catch (error) {
    console.error("CHECKOUT QUOTE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Could not verify package prices." },
      { status: 500 }
    );
  }
}
