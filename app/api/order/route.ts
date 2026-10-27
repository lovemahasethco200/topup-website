
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import Game from "@/models/Game";
import PackageModel from "@/models/Package";
import WalletTransaction from "@/models/WalletTransaction";
import {
  CUSTOMER_COOKIE_NAME,
  verifyCustomerSession,
} from "@/lib/customerAuth";

export const runtime = "nodejs";

type RequestedItem = {
  packageId: string;
  quantity: number;
};

type VerifiedItem = {
  packageId: mongoose.Types.ObjectId;
  packageName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function priceToNumber(value: unknown): number | null {
  const cleaned = String(value ?? "").replace(/,/g, "");
  const match = cleaned.match(/\d+(?:\.\d+)?/);

  if (!match) return null;

  const amount = Number(match[0]);

  if (!Number.isSafeInteger(amount) || amount < 1) return null;

  return amount;
}

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function parseRequestedItems(body: any): RequestedItem[] | null {
  // New multi-package checkout.
  if (Array.isArray(body.items)) {
    if (body.items.length < 1 || body.items.length > 50) {
      return null;
    }

    const seen = new Set<string>();
    const result: RequestedItem[] = [];

    for (const item of body.items) {
      const packageId = cleanText(item?.packageId);
      const quantity = Number(item?.quantity);

      if (
        !mongoose.isValidObjectId(packageId) ||
        !Number.isSafeInteger(quantity) ||
        quantity < 1 ||
        quantity > 99 ||
        seen.has(packageId)
      ) {
        return null;
      }

      seen.add(packageId);
      result.push({ packageId, quantity });
    }

    return result;
  }

  // Backward compatibility for older single-package checkout requests.
  const packageName = cleanText(body.package);

  if (!packageName) return null;

  return [];
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      game,
      package: legacyPackageName,
      uid,
      nickname,
      phone,
      paymentMethod,
      transactionId,
      customerNote,
      checkoutRequestId,
    } = body;

    const cleanGame = cleanText(game);
    const cleanUid = cleanText(uid);
    const cleanNickname = cleanText(nickname);
    const cleanPhone = cleanText(phone);
    const cleanNote = cleanText(customerNote);
    const selectedMethod = cleanText(paymentMethod) || "eSewa";
    const isWallet = selectedMethod.toLowerCase() === "wallet";

   if (!cleanGame || !cleanUid || !cleanNickname) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required order fields.",
        },
        { status: 400 }
      );
    }

    const sessionToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
    const customerSession = sessionToken
      ? await verifyCustomerSession(sessionToken)
      : null;

    if (
      isWallet &&
      (!customerSession?.userId ||
        !mongoose.isValidObjectId(customerSession.userId))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to pay using your wallet.",
        },
        { status: 401 }
      );
    }

    const safeGame = escapeRegex(cleanGame);

    const gameRecord = await Game.findOne({
      active: true,
      $or: [
        { name: { $regex: `^${safeGame}$`, $options: "i" } },
        { slug: { $regex: `^${safeGame}$`, $options: "i" } },
      ],
    }).lean();

    if (!gameRecord) {
      return NextResponse.json(
        { success: false, message: "This game is unavailable." },
        { status: 400 }
      );
    }

    const requestedItems = parseRequestedItems(body);

    if (requestedItems === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid package selection or quantity.",
        },
        { status: 400 }
      );
    }

    let verifiedItems: VerifiedItem[] = [];

    if (requestedItems.length > 0) {
      const packageIds = requestedItems.map(
        (item) => new mongoose.Types.ObjectId(item.packageId)
      );

      const packageRecords = await PackageModel.find({
        _id: { $in: packageIds },
        gameSlug: gameRecord.slug,
        active: true,
      }).lean();

      if (packageRecords.length !== requestedItems.length) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more packages are unavailable. Please refresh and try again.",
          },
          { status: 400 }
        );
      }

      const packageMap = new Map(
        packageRecords.map((record: any) => [
          String(record._id),
          record,
        ])
      );

      verifiedItems = requestedItems.map((requested) => {
        const record: any = packageMap.get(requested.packageId);

        if (!record) {
          throw new Error("PACKAGE_NOT_FOUND");
        }

        const unitPrice = priceToNumber(record.price);

        if (unitPrice === null) {
          throw new Error("INVALID_PACKAGE_PRICE");
        }

        const subtotal = unitPrice * requested.quantity;

        if (!Number.isSafeInteger(subtotal)) {
          throw new Error("INVALID_ORDER_TOTAL");
        }

        return {
          packageId: new mongoose.Types.ObjectId(requested.packageId),
          packageName: String(record.name),
          quantity: requested.quantity,
          unitPrice,
          subtotal,
        };
      });
    } else {
      // Legacy request: resolve its package name from the database.
      const safePackage = escapeRegex(cleanText(legacyPackageName));

      const record: any = await PackageModel.findOne({
        gameSlug: gameRecord.slug,
        name: { $regex: `^${safePackage}$`, $options: "i" },
        active: true,
      }).lean();

      if (!record) {
        return NextResponse.json(
          { success: false, message: "This package is unavailable." },
          { status: 400 }
        );
      }

      const unitPrice = priceToNumber(record.price);

      if (unitPrice === null) {
        throw new Error("INVALID_PACKAGE_PRICE");
      }

      verifiedItems = [
        {
          packageId: new mongoose.Types.ObjectId(String(record._id)),
          packageName: String(record.name),
          quantity: 1,
          unitPrice,
          subtotal: unitPrice,
        },
      ];
    }

    const total = verifiedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    if (!Number.isSafeInteger(total) || total < 1) {
      throw new Error("INVALID_ORDER_TOTAL");
    }

    const packageSummary = verifiedItems
      .map((item) =>
        item.quantity > 1
          ? `${item.packageName} x ${item.quantity}`
          : item.packageName
      )
      .join(", ");

    const savedItems = verifiedItems.map((item) => ({
      packageId: item.packageId,
      packageName: item.packageName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    // Wallet purchases need an idempotency key to prevent duplicate charges.
    let requestId = "";

    if (isWallet) {
      requestId = cleanText(checkoutRequestId);

      if (!requestId || requestId.length > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid checkout request. Please refresh and try again.",
          },
          { status: 400 }
        );
      }

      const existingOrder = await Order.findOne({
        userId: customerSession!.userId,
        checkoutRequestId: requestId,
      }).lean();

      if (existingOrder) {
        const existingItems = Array.isArray(existingOrder.items)
          ? existingOrder.items.map((item: any) => ({
              packageId: String(item.packageId),
              quantity: Number(item.quantity),
            }))
          : [];

        const requestedCanonical = verifiedItems
          .map((item) => ({
            packageId: String(item.packageId),
            quantity: item.quantity,
          }))
          .sort((a, b) => a.packageId.localeCompare(b.packageId));

        const existingCanonical = existingItems
  .map((item: { packageId: string; quantity: number }) => ({
    packageId: item.packageId,
    quantity: item.quantity,
  }))
  .sort(
  (a: { packageId: string; quantity: number }, b: { packageId: string; quantity: number }) =>
    a.packageId.localeCompare(b.packageId)
);

        const sameItems: boolean =
  existingCanonical.length === requestedCanonical.length &&
  existingCanonical.every(
    (
      item: { packageId: string; quantity: number },
      index: number
    ): boolean => {
      const requested = requestedCanonical[index];

      return (
        item.packageId === requested.packageId &&
        item.quantity === requested.quantity
      );
    }
  );

        // Older wallet orders did not have an items array.
        const sameLegacyOrder =
          existingItems.length === 0 &&
          verifiedItems.length === 1 &&
          verifiedItems[0].quantity === 1 &&
          String(existingOrder.package) === verifiedItems[0].packageName &&
          Number(String(existingOrder.price).replace(/[^\d.]/g, "")) ===
            total;

        const sameOrder =
          String(existingOrder.game) === String(gameRecord.name) &&
          (sameItems || sameLegacyOrder) &&
          String(existingOrder.uid) === cleanUid &&
          String(existingOrder.nickname) === cleanNickname &&
          String(existingOrder.phone || "") === cleanPhone &&
          String(existingOrder.customerNote || "") === cleanNote;

        if (!sameOrder) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Checkout details changed. Please refresh and try again.",
            },
            { status: 409 }
          );
        }

        const currentUser = await User.findById(
          customerSession!.userId
        ).select("walletBalance");

        return NextResponse.json(
          {
            success: true,
            message: "This order has already been placed.",
            order: existingOrder,
            walletBalance: Number(currentUser?.walletBalance || 0),
          },
          { status: 200 }
        );
      }
    }

    let userId: mongoose.Types.ObjectId | null = null;

    if (
      customerSession?.userId &&
      mongoose.isValidObjectId(customerSession.userId)
    ) {
      const user = await User.findOne({
        _id: customerSession.userId,
        isActive: true,
      }).select("_id");

      if (user) userId = user._id;
    }

    const orderData: Record<string, any> = {
      game: gameRecord.name,
      package: packageSummary,
      price: String(total),
      items: savedItems,
      uid: cleanUid,
      nickname: cleanNickname,
      phone: cleanPhone,
      ...(userId ? { userId } : {}),
      paymentMethod: isWallet ? "Wallet" : selectedMethod,
      transactionId: isWallet ? "" : cleanText(transactionId),
      customerNote: cleanNote,
      adminNote: "",
      status: "Pending",
    };

    if (isWallet) {
      orderData.userId = new mongoose.Types.ObjectId(
        customerSession!.userId
      );
      orderData.checkoutRequestId = requestId;

      const mongoSession = await mongoose.startSession();
      let createdOrder: any = null;
      let newBalance: number | null = null;

      try {
        await mongoSession.withTransaction(async () => {
          const user = await User.findOne({
            _id: customerSession!.userId,
            isActive: true,
          }).session(mongoSession);

          if (!user) {
            throw new Error("CUSTOMER_NOT_FOUND");
          }

          if (Number(user.walletBalance || 0) < total) {
            throw new Error("INSUFFICIENT_WALLET_BALANCE");
          }

          const updatedUser = await User.findOneAndUpdate(
            {
              _id: user._id,
              isActive: true,
              walletBalance: { $gte: total },
            },
            { $inc: { walletBalance: -total } },
            { new: true, session: mongoSession }
          );

          if (!updatedUser) {
            throw new Error("INSUFFICIENT_WALLET_BALANCE");
          }

          const [order] = await Order.create([orderData], {
            session: mongoSession,
          });

          await WalletTransaction.create(
            [
              {
                userId: updatedUser._id,
                type: "purchase",
                amount: total,
                paymentMethod: "Wallet",
                transactionReference: `ORDER-${order._id}`,
                status: "Approved",
                adminNote: `Wallet payment for ${gameRecord.name} - ${packageSummary}`,
                reviewedAt: new Date(),
                reviewedBy: "system",
              },
            ],
            { session: mongoSession }
          );

          createdOrder = order;
          newBalance = Number(updatedUser.walletBalance || 0);
        });
      } finally {
        await mongoSession.endSession();
      }

      return NextResponse.json(
        {
          success: true,
          message: "Order placed successfully using your wallet.",
          order: createdOrder,
          walletBalance: newBalance,
        },
        { status: 200 }
      );
    }

    // eSewa/Khalti/IME Pay/bank transfer orders.
    // Prices and package details above are verified using MongoDB.
    const newOrder = await Order.create(orderData);

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully.",
        order: newOrder,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "INSUFFICIENT_WALLET_BALANCE") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Insufficient wallet balance. Please add money to your wallet.",
          },
          { status: 400 }
        );
      }

      if (error.message === "CUSTOMER_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Customer account not found or inactive. Please log in again.",
          },
          { status: 401 }
        );
      }

      if (error.message === "INVALID_PACKAGE_PRICE") {
        return NextResponse.json(
          {
            success: false,
            message:
              "A selected package has an invalid price. Please contact support.",
          },
          { status: 400 }
        );
      }

      if (
        error.message === "PACKAGE_NOT_FOUND" ||
        error.message === "INVALID_ORDER_TOTAL"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Could not validate the selected packages. Please refresh and try again.",
          },
          { status: 400 }
        );
      }
    }

    console.error("ORDER CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to place order.",
        error:
          process.env.NODE_ENV !== "production"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
