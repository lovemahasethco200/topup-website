
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type WalletData = {
  success: boolean;
  walletBalance?: number;
  message?: string;
};

type SelectedItem = {
  packageId: string;
  quantity: number;
};

type QuotedPackage = {
  packageId: string;
  packageName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type QuoteData = {
  success: boolean;
  message?: string;
  game?: string;
  items?: QuotedPackage[];
  total?: number;
};

type StoredPlayerInfo = {
  game: string;
  uid: string;
  nickname: string;
  region?: string;
  verified?: boolean;
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const game = searchParams.get("game") || "";
  const rawItems = searchParams.get("items") || "";
  const isFreeFire = game.toLowerCase().includes("free fire");

  const selectedItems = useMemo<SelectedItem[]>(() => {
    try {
      const parsed: unknown = JSON.parse(rawItems);

      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item): item is SelectedItem =>
          item !== null &&
          typeof item === "object" &&
          typeof item.packageId === "string" &&
          /^[a-f\d]{24}$/i.test(item.packageId) &&
          Number.isInteger(item.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 99
      );
    } catch {
      return [];
    }
  }, [rawItems]);

  const [quotedItems, setQuotedItems] = useState<QuotedPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState("");

  const [uid, setUid] = useState("");
  const [nickname, setNickname] = useState("");
  const [playerRegion, setPlayerRegion] = useState("");
  const [playerVerified, setPlayerVerified] = useState(false);
  const [playerInfoLoading, setPlayerInfoLoading] = useState(true);
  const [playerInfoError, setPlayerInfoError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("eSewa");
  const [transactionId, setTransactionId] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletLoggedIn, setWalletLoggedIn] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("");

  const isWalletPayment = paymentMethod === "Wallet";

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);

    try {
      const res = await fetch("/api/wallet", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data: WalletData = await res.json();

      if (res.ok && data.success) {
        setWalletLoggedIn(true);
        setWalletBalance(Number(data.walletBalance ?? 0));
      } else {
        setWalletLoggedIn(false);
        setWalletBalance(null);
      }
    } catch {
      setWalletLoggedIn(false);
      setWalletBalance(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    setPlayerInfoLoading(true);
    setPlayerInfoError("");
    setUid("");
    setNickname("");
    setPlayerRegion("");
    setPlayerVerified(false);

    try {
      const stored = sessionStorage.getItem("topupPlayerInfo");

      if (!stored) {
        setPlayerInfoError(
          "Player details were not found. Return to the game page and enter your details again."
        );
        return;
      }

      const parsed: unknown = JSON.parse(stored);

      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("game" in parsed) ||
        !("uid" in parsed) ||
        !("nickname" in parsed) ||
        typeof parsed.game !== "string" ||
        typeof parsed.uid !== "string" ||
        typeof parsed.nickname !== "string"
      ) {
        setPlayerInfoError(
          "Saved player details are invalid. Please enter them again."
        );
        return;
      }

      const player = parsed as StoredPlayerInfo;

      if (
        player.game.trim().toLowerCase() !== game.trim().toLowerCase() ||
        !player.uid.trim() ||
        !player.nickname.trim()
      ) {
        setPlayerInfoError(
          "Player details do not match the selected game. Return to the game page and try again."
        );
        return;
      }

      if (isFreeFire) {
        if (
          player.verified !== true ||
          typeof player.region !== "string" ||
          !player.region.trim()
        ) {
          setPlayerInfoError(
            "Free Fire UID verification information is missing. Return to the game page and check your UID again."
          );
          return;
        }

        setPlayerRegion(player.region.toUpperCase());
        setPlayerVerified(true);
      }

      setUid(player.uid.trim());
      setNickname(player.nickname.trim());
    } catch {
      setPlayerInfoError(
        "Could not read your player details. Return to the game page and try again."
      );
    } finally {
      setPlayerInfoLoading(false);
    }
  }, [game, isFreeFire]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      setQuoteLoading(true);
      setQuoteError("");
      setQuotedItems([]);
      setTotal(0);

      if (!game || selectedItems.length === 0) {
        setQuoteError(
          "No valid packages selected. Return and select packages."
        );
        setQuoteLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ game, items: selectedItems }),
        });

        const data: QuoteData = await res.json();

        if (!res.ok || !data.success || !Array.isArray(data.items)) {
          throw new Error(data.message || "Unable to verify package prices.");
        }

        if (!cancelled) {
          setQuotedItems(data.items);
          setTotal(Number(data.total ?? 0));
        }
      } catch (err) {
        if (!cancelled) {
          setQuoteError(
            err instanceof Error
              ? err.message
              : "Unable to load package prices. Please try again."
          );
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [game, selectedItems]);

  function formatPrice(value: number) {
    return `Rs. ${value.toLocaleString()}`;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (playerInfoLoading) {
      setError("Please wait while player details are loaded.");
      return;
    }

    if (playerInfoError || !uid.trim() || !nickname.trim()) {
      setError(playerInfoError || "Player details are missing.");
      return;
    }

    if (isFreeFire && (!playerVerified || !playerRegion)) {
      setError("Please verify your Free Fire UID again.");
      return;
    }

    if (quoteLoading || quoteError || quotedItems.length === 0) {
      setError("Please wait until package prices are verified.");
      return;
    }

    if (isWalletPayment && !walletLoggedIn) {
      setError("Please log in before using wallet payment.");
      return;
    }

    if (
      isWalletPayment &&
      walletBalance !== null &&
      walletBalance < total
    ) {
      setError("Insufficient wallet balance. Please add money first.");
      return;
    }

    try {
      const requestId =
        isWalletPayment && checkoutRequestId
          ? checkoutRequestId
          : crypto.randomUUID();

      if (isWalletPayment && !checkoutRequestId) {
        setCheckoutRequestId(requestId);
      }

      setLoading(true);

      const packageSummary = quotedItems
        .map((item) => `${item.packageName} x ${item.quantity}`)
        .join(", ");

      const payload = {
        game,
        items: selectedItems,
        package: packageSummary,
        price: formatPrice(total),
        uid: uid.trim(),
        nickname: nickname.trim(),
        phone: "",
        paymentMethod,
        ...(isFreeFire ? { region: playerRegion } : {}),
        checkoutRequestId: isWalletPayment ? requestId : undefined,
        transactionId: isWalletPayment ? "" : transactionId.trim(),
        customerNote: customerNote.trim(),
      };

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to place order.");
        if (isWalletPayment) void loadWallet();
        return;
      }

      if (isWalletPayment && typeof data.walletBalance === "number") {
        setWalletBalance(data.walletBalance);
      }

      const orderId = data.order?._id;

      if (!orderId) {
        setError(
          "Order was created, but the server did not return its ID. Contact support."
        );
        return;
      }

      setSuccessMessage(
        isWalletPayment
          ? "Wallet payment successful! Your order has been placed."
          : "Order placed successfully! Opening your tracking page..."
      );

      window.setTimeout(() => {
        router.push(`/track-order?id=${encodeURIComponent(orderId)}`);
      }, 800);
    } catch (err) {
      console.error("CHECKOUT ERROR:", err);
      setError("Something went wrong while placing the order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const displayWalletBalance =
    walletBalance === null ? "Unavailable" : formatPrice(walletBalance);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold md:text-4xl">Checkout</h1>
            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Confirm your selected packages and submit your order.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-8 lg:col-span-2">
              <h2 className="text-2xl font-bold">Player Details</h2>
              <p className="mt-1 text-sm text-slate-400">
                These details were entered on the game page.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                {playerInfoLoading ? (
                  <p className="text-sm text-cyan-300">
                    Loading player details...
                  </p>
                ) : playerInfoError ? (
                  <div>
                    <p className="text-sm text-rose-300">{playerInfoError}</p>
                    <button
                      type="button"
                      onClick={() => router.push("/games")}
                      className="mt-3 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      Return to Games
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        UID / Player ID
                      </p>
                      <p className="mt-1 break-all font-semibold text-white">
                        {uid}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        In-game Nickname
                      </p>
                      <p className="mt-1 break-words font-semibold text-white">
                        {nickname}
                      </p>

                      {isFreeFire ? (
                        playerVerified && playerRegion ? (
                          <p className="mt-1 text-xs text-emerald-400">
                            ✓ UID lookup completed · Region: {playerRegion}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-rose-300">
                            UID verification required.
                          </p>
                        )
                      ) : (
                        <p className="mt-1 text-xs text-amber-300">
                          Manually entered; not automatically verified.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="IME Pay">IME Pay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Wallet">TopupCenter Wallet</option>
                  </select>
                </div>

                {isWalletPayment && (
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                    <p className="text-sm text-cyan-200">Your Wallet Balance</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-300">
                      {walletLoading ? "Loading..." : displayWalletBalance}
                    </p>

                    {!walletLoading && !walletLoggedIn && (
                      <>
                        <p className="mt-2 text-sm text-amber-300">
                          Log in to your customer account to use wallet payment.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push("/login")}
                          className="mt-3 rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10"
                        >
                          Log In
                        </button>
                      </>
                    )}

                    {walletLoggedIn &&
                      walletBalance !== null &&
                      walletBalance < total && (
                        <>
                          <p className="mt-2 text-sm text-amber-300">
                            Your wallet balance may not be enough for this order.
                          </p>
                          <button
                            type="button"
                            onClick={() => router.push("/account")}
                            className="mt-3 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                          >
                            Add Money
                          </button>
                        </>
                      )}
                  </div>
                )}

                {!isWalletPayment && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Transaction ID
                    </label>
                    <input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Optional payment reference / Txn ID"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Customer Note
                  </label>
                  <input
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Optional note for admin"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {quoteLoading && (
                  <p className="text-sm text-cyan-300">
                    Verifying package prices...
                  </p>
                )}

                {quoteError && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {quoteError}
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="ml-2 underline"
                    >
                      Refresh
                    </button>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    playerInfoLoading ||
                    Boolean(playerInfoError) ||
                    (isFreeFire && !playerVerified) ||
                    quoteLoading ||
                    Boolean(quoteError) ||
                    quotedItems.length === 0 ||
                    (isWalletPayment && walletLoading)
                  }
                  className="w-full rounded-2xl bg-cyan-500 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Placing Order..."
                    : isWalletPayment
                      ? "Pay with Wallet"
                      : "Place Order"}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
              <h2 className="text-2xl font-bold">Order Summary</h2>
              <p className="mt-1 text-sm text-slate-400">
                {game || "Selected game"}
              </p>

              <div className="mt-6 space-y-3">
                {quotedItems.map((item) => (
                  <div
                    key={item.packageId}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <p className="font-semibold">{item.packageName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                    <p className="mt-2 text-right font-semibold text-white">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                ))}

                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                  <p className="text-sm text-cyan-200">Total</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">
                    {quoteLoading ? "Loading..." : formatPrice(total)}
                  </p>
                  {isWalletPayment && (
                    <p className="mt-2 text-xs text-cyan-100/70">
                      The server should verify the total before charging your wallet.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <h3 className="text-sm font-semibold text-amber-300">
                  Payment Reminder
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-amber-100/90">
                  {isWalletPayment ? (
                    <>
                      <li>• Confirm your UID and nickname before paying.</li>
                      <li>• The total is deducted when the order is placed.</li>
                      <li>• Your top-up order will still need processing.</li>
                    </>
                  ) : (
                    <>
                      <li>• Check your UID and nickname carefully.</li>
                      <li>• Add your transaction ID if available.</li>
                      <li>• Orders are processed after payment verification.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-white">
          <Navbar />
          <div className="px-4 py-10 text-center">Loading checkout...</div>
          <Footer />
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
