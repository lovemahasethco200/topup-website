"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const game = searchParams.get("game") || "Unknown Game";
  const packageName = searchParams.get("package") || "Unknown Package";
  const price = searchParams.get("price") || "Rs. 0";

  const [uid, setUid] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("eSewa");
  const [transactionId, setTransactionId] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const orderSummary = useMemo(
    () => ({
      game,
      package: packageName,
      price,
    }),
    [game, packageName, price]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!uid.trim() || !nickname.trim() || !phone.trim()) {
      setError("UID, Nickname and Phone are required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        game: orderSummary.game,
        package: orderSummary.package,
        price: orderSummary.price,
        uid: uid.trim(),
        nickname: nickname.trim(),
        phone: phone.trim(),
        paymentMethod,
        transactionId: transactionId.trim(),
        customerNote: customerNote.trim(),
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to place order");
        return;
      }

      setSuccessMessage("Order placed successfully!");

      // track-order मा redirect with order id
      setTimeout(() => {
        if (data.order?._id) {
          router.push(`/track-order?id=${data.order._id}`);
        } else {
          router.push("/track-order");
        }
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while placing order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Top heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Checkout</h1>
          <p className="mt-2 text-sm text-slate-400 md:text-base">
            Complete your top-up order securely and submit payment details.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Order form */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-8">
            <h2 className="text-2xl font-bold">Player Information</h2>
            <p className="mt-1 text-sm text-slate-400">
              Fill the required details carefully before placing the order.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    UID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    placeholder="Enter your game UID"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Nickname <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter in-game nickname"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="IME Pay">IME Pay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* NEW FIELDS */}
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Optional payment reference / Txn ID"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Customer Note
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Optional note for admin"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-cyan-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          </div>

          {/* Right: order summary */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
            <h2 className="text-2xl font-bold">Order Summary</h2>
            <p className="mt-1 text-sm text-slate-400">
              Review your selected package before payment.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Game</p>
                <p className="mt-1 text-lg font-semibold">{orderSummary.game}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">Package</p>
                <p className="mt-1 text-lg font-semibold">
                  {orderSummary.package}
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                <p className="text-sm text-cyan-200">Price</p>
                <p className="mt-1 text-2xl font-bold text-cyan-300">
                  {orderSummary.price}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <h3 className="text-sm font-semibold text-amber-300">
                Payment Reminder
              </h3>
              <ul className="mt-2 space-y-2 text-sm text-amber-100/90">
                <li>• Make sure UID and nickname are correct.</li>
                <li>• Add transaction ID after payment if available.</li>
                <li>• Orders are usually processed quickly after verification.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
          <div className="mx-auto max-w-6xl text-center">
            Loading checkout...
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}