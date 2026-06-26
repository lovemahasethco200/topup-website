"use client";

import Link from "next/link";

export default function PaymentFailPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">❌</div>

        <h1 className="text-3xl font-bold text-red-400 mb-3">
          Payment Failed
        </h1>

        <p className="text-slate-300 mb-6">
          Your payment could not be completed. Please try again.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <Link
            href="/games"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl"
          >
            Try Again
          </Link>

          <Link
            href="/track-order"
            className="bg-slate-800 hover:bg-slate-700 font-bold py-3 rounded-xl"
          >
            Track Order
          </Link>
        </div>
      </div>
    </main>
  );
}