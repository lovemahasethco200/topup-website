
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  walletBalance: number;
};

type CustomerOrder = {
  id: string;
  game: string;
  package: string;
  price: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
};

type WalletTransaction = {
  id: string;
  amount: number;
  type: string;
  paymentMethod?: string;
  transactionReference?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
};

const paymentMethods = [
  "eSewa",
  "Khalti",
  "Bank Transfer",
  "Other",
];

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "approved":
      return "border-green-500/30 bg-green-500/10 text-green-400";
    case "processing":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "cancelled":
    case "failed":
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    default:
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
  }
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [walletError, setWalletError] = useState("");

  const [walletTab, setWalletTab] = useState<"deposit" | "redeem">("deposit");
  const [amount, setAmount] = useState("100");
  const [paymentMethod, setPaymentMethod] = useState("eSewa");
  const [reference, setReference] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMessage, setDepositMessage] = useState("");
  const [depositError, setDepositError] = useState("");

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMessage, setRedeemMessage] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);

  const loadOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setOrdersError("");

    try {
      const response = await fetch("/api/customer/orders", {
        cache: "no-store",
      });
      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setOrdersError(
        err instanceof Error ? err.message : "Unable to load your orders."
      );
    } finally {
      setOrdersLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError("");

    try {
      const response = await fetch("/api/wallet", {
        cache: "no-store",
      });
      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load wallet.");
      }

      setUser((current) =>
        current
          ? {
              ...current,
              walletBalance: Number(
                data.walletBalance ?? current.walletBalance ?? 0
              ),
            }
          : current
      );

      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      );
    } catch (err) {
      setWalletError(
        err instanceof Error ? err.message : "Unable to load wallet."
      );
    } finally {
      setWalletLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          router.replace("/login");
          return;
        }

        setUser(data.user);
        await Promise.all([loadOrders(), loadWallet()]);
      } catch {
        setError("Unable to load your account. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [router, loadOrders, loadWallet]);

  async function handleDeposit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDepositMessage("");
    setDepositError("");

    const numericAmount = Number(amount);

    if (
      !Number.isInteger(numericAmount) ||
      numericAmount < 10 ||
      numericAmount > 100000
    ) {
      setDepositError("Amount Rs. 10 देखि Rs. 100,000 सम्म हुनुपर्छ।");
      return;
    }

    if (reference.trim().length < 3) {
      setDepositError("सही transaction reference राख्नुहोस्।");
      return;
    }

    setDepositLoading(true);

    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          paymentMethod,
          transactionReference: reference.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Deposit request failed.");
      }

      setDepositMessage(
        data.message ||
          "Deposit request पठाइयो। Admin verification पछि मात्र wallet मा रकम थपिनेछ।"
      );
      setReference("");
      setAmount("100");
      await loadWallet();
    } catch (err) {
      setDepositError(
        err instanceof Error ? err.message : "Deposit request failed."
      );
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Logout failed. Please try again.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading your account...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        {error || "Redirecting to login..."}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="text-xl font-bold text-cyan-400">
            TopupCenter
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
          >
            Logout
          </button>
        </header>

        <section className="py-10">
          <p className="text-sm text-cyan-400">CUSTOMER DASHBOARD</p>
          <h1 className="mt-2 text-3xl font-bold">
            Welcome, {user.name}!
          </h1>
          <p className="mt-2 text-slate-400">
            Manage your TopupCenter account from here.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-400/20 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Available Wallet Balance</p>
            <p className="mt-3 text-3xl font-bold text-cyan-400">
              Rs. {Number(user.walletBalance || 0).toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Deposit approval पछि मात्र balance बढ्नेछ।
            </p>
            <button
              onClick={loadWallet}
              disabled={walletLoading}
              className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {walletLoading ? "Refreshing..." : "Refresh Wallet"}
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Account Details</p>
            <p className="mt-3 font-semibold">{user.name}</p>
            <p className="mt-2 break-all text-sm text-slate-400">
              {user.email || "No email added"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {user.phone || "No phone added"}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Wallet Center</h2>
          <p className="mt-2 text-sm text-slate-400">
            Add money to your wallet or redeem a code.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setWalletTab("deposit");
                setDepositError("");
                setDepositMessage("");
              }}
              className={`rounded-xl border p-3 font-semibold ${
                walletTab === "deposit"
                  ? "border-cyan-400 bg-cyan-400 text-slate-950"
                  : "border-white/10 bg-slate-950 hover:bg-white/5"
              }`}
            >
              + Add Money
            </button>
            <button
              type="button"
              onClick={() => {
                setWalletTab("redeem");
                setRedeemError("");
                setRedeemMessage("");
              }}
              className={`rounded-xl border p-3 font-semibold ${
                walletTab === "redeem"
                  ? "border-cyan-400 bg-cyan-400 text-slate-950"
                  : "border-white/10 bg-slate-950 hover:bg-white/5"
              }`}
            >
              Redeem Code
            </button>
          </div>

          {walletTab === "deposit" ? (
            <form onSubmit={handleDeposit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="deposit-amount" className="mb-2 block text-sm font-medium">
                  Deposit Amount (NPR)
                </label>
                <input
                  id="deposit-amount"
                  type="number"
                  min="10"
                  max="100000"
                  step="1"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Enter amount"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Minimum Rs. 10 · Maximum Rs. 100,000
                </p>
              </div>

              <div>
                <label htmlFor="payment-method" className="mb-2 block text-sm font-medium">
                  Payment Method
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="transaction-reference" className="mb-2 block text-sm font-medium">
                  Transaction ID / Reference
                </label>
                <input
                  id="transaction-reference"
                  type="text"
                  minLength={3}
                  maxLength={150}
                  required
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  placeholder="Enter your payment reference"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Payment गरेपछि आएको वास्तविक reference राख्नुहोस्।
                </p>
              </div>

              {depositError && (
                <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {depositError}
                </p>
              )}

              {depositMessage && (
                <p role="status" className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
                  {depositMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={depositLoading}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {depositLoading ? "Submitting..." : "Submit Deposit Request"}
              </button>

              <p className="text-xs text-slate-500">
                Submit गरेपछि रकम तुरुन्तै wallet मा थपिँदैन। Admin ले payment verify गरेर approve गरेपछि मात्र balance बढ्छ।
              </p>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="redeem-code" className="mb-2 block text-sm font-medium">
                  Your Redeem Code
                </label>
                <input
                  id="redeem-code"
                  type="text"
                  value={redeemCode}
                  onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
                  maxLength={100}
                  placeholder="e.g. TOPUP-XXXX-XXXX"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 uppercase outline-none focus:border-cyan-400"
                />
              </div>

              {redeemError && (
                <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {redeemError}
                </p>
              )}

              {redeemMessage && (
                <p role="status" className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
                  {redeemMessage}
                </p>
              )}

              
<button
  type="button"
  disabled={redeemLoading || !redeemCode.trim()}
  onClick={async () => {
    setRedeemError("");
    setRedeemMessage("");

    if (!redeemCode.trim()) {
      setRedeemError("Please enter a redeem code.");
      return;
    }

    try {
      setRedeemLoading(true);

      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: redeemCode.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Redeem failed. Please check your code."
        );
      }

      setRedeemMessage(
        `Success! Rs. ${Number(data.amount).toFixed(2)} added to your wallet.`
      );
      setRedeemCode("");

      await loadWallet();
    } catch (error: unknown) {
      setRedeemError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setRedeemLoading(false);
    }
  }}
  className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
>
  {redeemLoading ? "Redeeming..." : "Redeem Code"}
</button>

<p className="text-sm text-slate-400">
  Redeem garepachi code ek patak matra use garna milchha. Successful
  redemption pachi wallet balance update huncha.
</p>


              <button
                type="button"
                onClick={() =>
                  router.push("/games")
                }
                className="w-full rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5"
              >
                Browse Games
              </button>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Wallet Transactions</h2>
              <p className="mt-1 text-sm text-slate-400">
                Your latest deposit requests and wallet activity.
              </p>
            </div>
            <button
              onClick={loadWallet}
              disabled={walletLoading}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {walletError && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {walletError}
            </p>
          )}

          {walletLoading ? (
            <p className="py-6 text-sm text-slate-400">Loading wallet history...</p>
          ) : transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No wallet transactions yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {transactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold capitalize">
                        {transaction.type || "Wallet transaction"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {transaction.paymentMethod || "Wallet"}
                        {transaction.transactionReference
                          ? ` · Ref: ${transaction.transactionReference}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-cyan-400">
                        Rs. {Number(transaction.amount).toFixed(2)}
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(transaction.status)}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                  {transaction.adminNote && (
                    <p className="mt-3 text-sm text-slate-400">
                      Admin note: {transaction.adminNote}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-500">
                    {transaction.createdAt
                      ? new Date(transaction.createdAt).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">My Orders</h2>
              <p className="mt-1 text-sm text-slate-400">
                View and track your top-up orders.
              </p>
            </div>

            <button
              onClick={() => loadOrders(true)}
              disabled={refreshing || ordersLoading}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {ordersLoading ? (
            <p className="py-8 text-sm text-slate-400">
              Loading your orders...
            </p>
          ) : ordersError ? (
            <div className="py-6">
              <p role="alert" className="text-sm text-red-400">{ordersError}</p>
              <button
                onClick={() => loadOrders(true)}
                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold">No orders yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Your orders will appear here after you place an order while logged in.
              </p>
              <Link
                href="/games"
                className="mt-5 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Browse Games
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <p className="text-xs text-slate-500">
                Showing your latest {orders.length} order(s).
              </p>
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{order.game}</h3>
                      <p className="mt-1 text-sm text-slate-300">{order.package}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(order.status || "Pending")}`}
                    >
                      {order.status || "Pending"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Order Amount</p>
                      <p className="mt-1 font-semibold">Rs. {order.price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Payment Method</p>
                      <p className="mt-1 text-sm">{order.paymentMethod || "Not specified"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-500">Order Date</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString()
                          : "Date unavailable"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="mt-5 text-sm text-red-400">{error}</p>
        )}
      </div>
    </main>
  );
}
