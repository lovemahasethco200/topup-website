"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") || "";
  const game = searchParams.get("game") || "Game Topup";
  const price = searchParams.get("price") || "Rs. 0";

  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(true);

  useEffect(() => {
    const updateOrderStatus = async () => {
      if (!orderId) {
        setUpdating(false);
        return;
      }

      try {
        await fetch("/api/payment/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
        });
      } catch (error) {
        console.error("Failed to update order status:", error);
      }

      setUpdating(false);
    };

    updateOrderStatus();
  }, [orderId]);

  const copyOrderId = async () => {
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>

        <h1 className="text-3xl font-bold text-green-400 mb-3">
          Payment Successful
        </h1>

        <p className="text-slate-300 mb-6">
          Your order has been placed successfully.
        </p>

        <div className="bg-slate-800 rounded-xl p-5 text-left space-y-3 mb-6">
          <p>
            <span className="font-semibold">Game:</span> {game}
          </p>
          <p>
            <span className="font-semibold">Amount:</span> {price}
          </p>
          <div className="break-all">
            <span className="font-semibold">Order ID:</span>{" "}
            {orderId || "Not available"}
          </div>
          <p>
            <span className="font-semibold">Order Status:</span>{" "}
            {updating ? "Updating..." : "Processing"}
          </p>
        </div>

        {orderId && (
          <button
            onClick={copyOrderId}
            className="mb-4 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
          >
            {copied ? "Copied!" : "Copy Order ID"}
          </button>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <Link
            href={`/track-order?orderId=${orderId}`}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl"
          >
            Track This Order
          </Link>

          <Link
            href="/games"
            className="bg-slate-800 hover:bg-slate-700 font-bold py-3 rounded-xl"
          >
            Back to Games
          </Link>
        </div>
      </div>
    </main>
  );
}