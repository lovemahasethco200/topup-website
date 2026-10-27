
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PackageItem = {
  _id: string;
  name: string;
  category?: string;
  price: string;
  bonus?: string;
};

type Props = {
  gameName: string;
  packages: PackageItem[];
};

type FreeFirePlayer = {
  uid: string;
  nickname: string;
  region: string;
};

const REGIONS = [
  { value: "BD", label: "Bangladesh (BD)" },
  { value: "SG", label: "Singapore (SG)" },
  { value: "IND", label: "India (IND)" },
  { value: "ME", label: "Middle East (ME)" },
  { value: "BR", label: "Brazil (BR)" },
  { value: "US", label: "United States (US)" },
  { value: "VN", label: "Vietnam (VN)" },
  { value: "TH", label: "Thailand (TH)" },
  { value: "CIS", label: "CIS" },
  { value: "ID", label: "Indonesia (ID)" },
  { value: "PK", label: "Pakistan (PK)" },
];

function priceToNumber(value: string): number {
  const match = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export default function TopupPackageSelector({
  gameName,
  packages,
}: Props) {
  const router = useRouter();

  const [activeCategory, setActiveCategory] =
    useState("All Packages");
  const [selected, setSelected] =
    useState<Record<string, number>>({});
  const [uid, setUid] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [region, setRegion] = useState("BD");
  const [checkingUid, setCheckingUid] = useState(false);
  const [verifiedPlayer, setVerifiedPlayer] =
    useState<FreeFirePlayer | null>(null);

  const isFreeFire = gameName.toLowerCase().includes("free fire");

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        packages
          .map((pkg) => pkg.category?.trim())
          .filter((category): category is string => Boolean(category))
      )
    );

    return ["All Packages", ...uniqueCategories];
  }, [packages]);

  const visiblePackages = useMemo(() => {
    if (activeCategory === "All Packages") return packages;

    return packages.filter(
      (pkg) =>
        (pkg.category?.trim() || "General") === activeCategory
    );
  }, [packages, activeCategory]);

  const selectedItems = packages.filter(
    (pkg) => (selected[pkg._id] || 0) > 0
  );

  const total = selectedItems.reduce(
    (sum, pkg) =>
      sum + priceToNumber(pkg.price) * selected[pkg._id],
    0
  );

  function updateQuantity(id: string, quantity: number) {
    setError("");

    setSelected((current) => {
      const next = { ...current };

      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = Math.min(99, quantity);
      }

      return next;
    });
  }

  function handleUidChange(value: string) {
    setUid(value);
    setNickname("");
    setVerifiedPlayer(null);
    setError("");
  }

  async function checkFreeFireUid() {
    setError("");
    setNickname("");
    setVerifiedPlayer(null);

    const cleanUid = uid.trim();

    if (!/^\d{5,20}$/.test(cleanUid)) {
      setError("Please enter a valid numeric Free Fire UID.");
      return;
    }

    setCheckingUid(true);

    try {
      const params = new URLSearchParams({
        uid: cleanUid,
        region,
      });

      const response = await fetch(
        `/api/freefire/player?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not verify this UID."
        );
      }

      if (
        String(data.uid) !== cleanUid ||
        typeof data.nickname !== "string" ||
        !data.nickname.trim()
      ) {
        throw new Error(
          "Invalid player information returned by the API."
        );
      }

      const player: FreeFirePlayer = {
        uid: String(data.uid),
        nickname: data.nickname.trim(),
        region: String(data.region || region).toUpperCase(),
      };

      if (player.region !== region.toUpperCase()) {
        throw new Error(
          "The returned player region does not match your selection."
        );
      }

      setNickname(player.nickname);
      setVerifiedPlayer(player);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify UID. Please try again."
      );
    } finally {
      setCheckingUid(false);
    }
  }

  function continueToCheckout() {
    setError("");

    if (!uid.trim()) {
      setError("Please enter your UID / Player ID.");
      return;
    }

    if (isFreeFire) {
      if (
        !verifiedPlayer ||
        verifiedPlayer.uid !== uid.trim() ||
        verifiedPlayer.region !== region.toUpperCase() ||
        verifiedPlayer.nickname !== nickname
      ) {
        setError("Please check and verify your Free Fire UID first.");
        return;
      }
    } else if (!nickname.trim()) {
      setError("Please enter your in-game nickname.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Please select at least one package.");
      return;
    }

    const items = selectedItems.map((pkg) => ({
      packageId: pkg._id,
      quantity: selected[pkg._id],
    }));

    try {
      sessionStorage.setItem(
        "topupPlayerInfo",
        JSON.stringify({
          game: gameName,
          uid: uid.trim(),
          nickname: nickname.trim(),
          ...(isFreeFire
            ? {
                region,
                verified: Boolean(
                  verifiedPlayer &&
                    verifiedPlayer.uid === uid.trim() &&
                    verifiedPlayer.region === region.toUpperCase() &&
                    verifiedPlayer.nickname === nickname
                ),
              }
            : {}),
        })
      );

      const query = new URLSearchParams({
        game: gameName,
        items: JSON.stringify(items),
      });

      router.push(`/checkout?${query.toString()}`);
    } catch {
      setError(
        "Could not save your player details. Please try again."
      );
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-slate-900/80 p-5">
        <h2 className="text-lg font-bold text-white">
          Player Information
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Enter your game details carefully before selecting your package.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="player-uid"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              UID / Player ID
            </label>

            <input
              id="player-uid"
              type="text"
              inputMode="numeric"
              value={uid}
              onChange={(event) => handleUidChange(event.target.value)}
              placeholder="Enter your game UID"
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />

            {isFreeFire && (
              <div className="mt-3">
                <label
                  htmlFor="player-region"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Account Region
                </label>

                <select
                  id="player-region"
                  value={region}
                  onChange={(event) => {
                    setRegion(event.target.value);
                    setNickname("");
                    setVerifiedPlayer(null);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  {REGIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={checkFreeFireUid}
                  disabled={checkingUid || !uid.trim()}
                  className="mt-3 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkingUid ? "Checking UID..." : "Check UID"}
                </button>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="player-nickname"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              In-game Nickname
            </label>

            <input
              id="player-nickname"
              type="text"
              value={nickname}
              onChange={(event) => {
                if (!isFreeFire) {
                  setNickname(event.target.value);
                  setError("");
                }
              }}
              placeholder={
                isFreeFire
                  ? "Check UID to fetch nickname"
                  : "Enter your game nickname"
              }
              readOnly={isFreeFire}
              autoComplete="off"
              maxLength={60}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 read-only:cursor-not-allowed read-only:opacity-80"
            />

            {isFreeFire && verifiedPlayer && (
              <p className="mt-2 text-sm text-emerald-400">
                ✓ UID lookup successful: {verifiedPlayer.nickname}
              </p>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {isFreeFire
            ? "Select your actual account region and check your UID before continuing."
            : "Please double-check your UID and nickname before continuing."}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-slate-400">
          Choose packages and quantities. Your selections stay saved when you switch categories.
        </p>

        <p className="text-sm font-medium text-cyan-300">
          {selectedItems.length} package type(s) selected
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => {
          const active = activeCategory === category;
          const count =
            category === "All Packages"
              ? packages.length
              : packages.filter(
                  (pkg) =>
                    (pkg.category?.trim() || "General") === category
                ).length;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border-cyan-400 bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30"
                  : "border-white/10 bg-slate-900 text-slate-300 hover:border-cyan-400/50 hover:text-white"
              }`}
            >
              {category}
              <span className="ml-2 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {packages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center">
          <h3 className="text-xl font-semibold text-white">
            No packages found
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Add an active package from the admin panel first.
          </p>
        </div>
      ) : visiblePackages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 p-8 text-center">
          <h3 className="text-lg font-semibold text-white">
            No packages in this category
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Try another category or view all packages.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visiblePackages.map((pkg) => {
            const quantity = selected[pkg._id] || 0;
            const chosen = quantity > 0;
            const category = pkg.category?.trim() || "General";

            return (
              <div
                key={pkg._id}
                className={`relative overflow-hidden rounded-2xl border p-5 transition duration-200 ${
                  chosen
                    ? "border-cyan-400 bg-cyan-400/[0.08] shadow-lg shadow-cyan-950/20"
                    : "border-white/10 bg-slate-900/80 hover:border-cyan-400/40"
                }`}
              >
                {chosen && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-cyan-400 px-3 py-1 text-xs font-bold text-slate-950">
                    SELECTED
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 pr-1">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                      {category}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      {pkg.name}
                    </h3>
                  </div>

                  <p className="shrink-0 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 font-bold text-cyan-300">
                    {pkg.price}
                  </p>
                </div>

                <p className="mt-3 min-h-10 text-sm leading-6 text-slate-400">
                  {pkg.bonus?.trim() ||
                    `Top up ${pkg.name} for ${gameName}.`}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-sm text-slate-400">
                    Quantity
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={`Decrease ${pkg.name} quantity`}
                      onClick={() => updateQuantity(pkg._id, quantity - 1)}
                      disabled={quantity === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-xl text-white transition hover:border-cyan-400 disabled:opacity-30"
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center font-bold text-white">
                      {quantity}
                    </span>

                    <button
                      type="button"
                      aria-label={`Increase ${pkg.name} quantity`}
                      onClick={() => updateQuantity(pkg._id, quantity + 1)}
                      disabled={quantity >= 99}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-xl font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {chosen && (
                  <p className="mt-3 text-right text-sm font-semibold text-cyan-300">
                    Subtotal: Rs.{" "}
                    {(priceToNumber(pkg.price) * quantity).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-slate-900 to-slate-950 p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">Combined total</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-cyan-300">
              Rs. {total.toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Final package prices should be verified by the server at checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={continueToCheckout}
            disabled={checkingUid || packages.length === 0}
            className="rounded-xl bg-cyan-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}
