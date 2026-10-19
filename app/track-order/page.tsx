
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type OrderType = {
  _id: string;
  game: string;
  package: string;
  price: string;
  uid: string;
  nickname: string;
  phone: string;
  paymentMethod: string;
  transactionId?: string;
  customerNote?: string;
  adminNote?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(idFromUrl);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderType | null>(null);

  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(!!idFromUrl);
  const [error, setError] = useState("");

  const fetchOrder = async (params: { id?: string; phone?: string }) => {
    try {
      setLoading(true);
      setError("");
      setOrder(null);

      const query = new URLSearchParams();

      if (params.id) query.set("id", params.id);
      if (params.phone) query.set("phone", params.phone);

      const res = await fetch(`/api/track-order?${query.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "No order found");
        return;
      }

      setOrder(data.order);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching order.");
    } finally {
      setLoading(false);
      setAutoLoading(false);
    }
  };

  useEffect(() => {
    if (!idFromUrl) {
      setAutoLoading(false);
      return;
    }

    setSearchId(idFromUrl);
    void fetchOrder({ id: idFromUrl });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromUrl]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchId.trim() && !phone.trim()) {
      setError("Please enter Order ID or Phone Number.");
      return;
    }

    await fetchOrder({
      id: searchId.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  const statusInfo = useMemo(() => {
    const status = order?.status?.toLowerCase() || "";

    if (status === "completed") {
      return {
        label: "Completed",
        classes:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      };
    }

    if (status === "cancelled") {
      return {
        label: "Cancelled",
        classes: "border-rose-500/30 bg-rose-500/10 text-rose-300",
      };
    }

    if (status === "processing") {
      return {
        label: "Processing",
        classes: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      };
    }

    return {
      label: order?.status || "Pending",
      classes: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    };
  }, [order]);

  const formattedDate = useMemo(() => {
    if (!order?.createdAt) return "N/A";

    try {
      return new Date(order.createdAt).toLocaleString();
    } catch {
      return order.createdAt;
    }
  }, [order]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">
            Track Your Order
          </h1>
          <p className="mt-2 text-sm text-slate-400 md:text-base">
            Enter your Order ID or Phone Number to check your latest top-up
            order status.
          </p>
        </div>

        {/* Search box */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-8">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Order ID
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Paste order ID"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || autoLoading}
                className="w-full rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || autoLoading ? "Checking..." : "Track Order"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          ) : null}
        </div>

        {/* Loading state */}
        {autoLoading ? (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl">
            <h2 className="text-2xl font-bold">Loading order...</h2>
            <p className="mt-2 text-sm text-slate-400">
              Please wait while we fetch your latest order details.
            </p>
          </div>
        ) : null}

        {/* Order card */}
        {order ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Left details */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl lg:col-span-2 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-400">
                    Order Details
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">{order.game}</h2>
                </div>

                <div
                  className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-semibold ${statusInfo.classes}`}
                >
                  {statusInfo.label}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoCard label="Order ID" value={order._id} />
                <InfoCard label="Package" value={order.package} />
                <InfoCard label="Price" value={order.price} />
                <InfoCard label="UID" value={order.uid} />
                <InfoCard label="Nickname" value={order.nickname} />
                <InfoCard label="Phone" value={order.phone} />
                <InfoCard
                  label="Payment Method"
                  value={order.paymentMethod || "N/A"}
                />
                <InfoCard
                  label="Transaction ID"
                  value={order.transactionId || "Not provided"}
                />
                <InfoCard label="Placed On" value={formattedDate} />
              </div>

              <div className="mt-6 grid gap-4">
                <LargeInfoCard
                  label="Customer Note"
                  value={order.customerNote || "No customer note provided."}
                />

                <LargeInfoCard
                  label="Admin Note"
                  value={
                    order.adminNote || "No admin update has been added yet."
                  }
                />
              </div>
            </div>

            {/* Right timeline / help */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
              <h3 className="text-2xl font-bold">Order Status</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your order is being tracked based on the latest admin update.
              </p>

              <div className="mt-6 space-y-4">
                <StatusStep
                  title="Order Placed"
                  active={true}
                  description="We received your order successfully."
                />

                <StatusStep
                  title="Payment Review"
                  active={["pending", "processing", "completed"].includes(
                    (order.status || "").toLowerCase()
                  )}
                  description="Payment and order details are being checked."
                />

                <StatusStep
                  title="Top-up Processing"
                  active={["processing", "completed"].includes(
                    (order.status || "").toLowerCase()
                  )}
                  description="Your game top-up is being processed by admin."
                />

                <StatusStep
                  title="Completed"
                  active={(order.status || "").toLowerCase() === "completed"}
                  description="Top-up delivered successfully."
                />

                {(order.status || "").toLowerCase() === "cancelled" ? (
                  <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                    This order has been cancelled. Please contact support if
                    you need assistance.
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <h4 className="text-sm font-semibold text-cyan-300">
                  Need help?
                </h4>
                <p className="mt-2 text-sm text-cyan-100/90">
                  If your order is delayed, contact support with your Order ID
                  and phone number for faster help.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 break-all text-base font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function LargeInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
        {value}
      </p>
    </div>
  );
}

function StatusStep({
  title,
  description,
  active,
}: {
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`mt-1 h-4 w-4 rounded-full border ${
          active
            ? "border-cyan-400 bg-cyan-400"
            : "border-slate-700 bg-slate-900"
        }`}
      />
      <div>
        <h5 className={`font-semibold ${active ? "text-white" : "text-slate-500"}`}>
          {title}
        </h5>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-10 text-center text-white">
          Loading order details...
        </main>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
