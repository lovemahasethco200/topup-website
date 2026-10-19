
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
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
        const res = await fetch("/api/payment/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
        });

        if (!res.ok) {
          console.error("Failed to update order status.");
        }
      } catch (error) {
        console.error("Failed to update order status:", error);
      } finally {
        setUpdating(false);
      }
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
      console.error("Failed to copy order ID:", error);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <div className="mb-4 text-5xl">🎉</div>

        <h1 className="mb-3 text-3xl font-bold text-green-400">
          Payment Successful
        </h1>

        <p className="mb-6 text-slate-300">
          Your order has been placed successfully.
        </p>

        <div className="mb-6 space-y-3 rounded-xl bg-slate-800 p-5 text-left">
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
            type="button"
            onClick={copyOrderId}
            className="mb-4 rounded-lg bg-slate-700 px-4 py-2 hover:bg-slate-600"
          >
            {copied ? "Copied!" : "Copy Order ID"}
          </button>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            href={
              orderId
                ? `/track-order?orderId=${encodeURIComponent(orderId)}`
                : "/track-order"
            }
            className="rounded-xl bg-cyan-500 py-3 font-bold text-black hover:bg-cyan-400"
          >
            Track This Order
          </Link>

          <Link
            href="/games"
            className="rounded-xl bg-slate-800 py-3 font-bold hover:bg-slate-700"
          >
            Back to Games
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-center text-white">
          Loading payment details...
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
