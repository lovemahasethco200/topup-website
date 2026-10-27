
"use client";

import StatusBadge from "@/components/admin/StatusBadge";
import InfoBox from "@/components/admin/InfoBox";
import TextBox from "@/components/admin/TextBox";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
};

type GameType = {
  _id: string;
  name: string;
  slug: string;
  desc?: string;
  image?: string;
};

type PackageType = {
  _id: string;
  gameSlug: string;
  gameName: string;
  name: string;
  category?: string;
  price: string;
  bonus?: string;
  active?: boolean;
  sortOrder?: number;

};

type DepositType = {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
};

const ORDER_STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Completed",
  "Cancelled",
];

export default function AdminPage() {
  const router = useRouter();

  // Tabs
  const [activeTab, setActiveTab] = useState<
  "orders" | "games" | "packages" | "wallet" | "redeem"
>("orders");
  // Orders
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] =
    useState<OrderType | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [statusInput, setStatusInput] = useState("Pending");

  // Games
  const [games, setGames] = useState<GameType[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gameName, setGameName] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [gameDesc, setGameDesc] = useState("");
  const [gameImage, setGameImage] = useState("");
  const [editingGame, setEditingGame] = useState<string | null>(null);

  // Packages
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packageGameSlug, setPackageGameSlug] = useState("");
  const [packageName, setPackageName] = useState("");
  const [packageCategory, setPackageCategory] = useState("General");
  const [packagePrice, setPackagePrice] = useState("");
  const [packageBonus, setPackageBonus] = useState("");
  const [packageSaving, setPackageSaving] = useState(false);
  const [editingPackage, setEditingPackage] =
  useState<PackageType | null>(null);
  const [packageSearch, setPackageSearch] = useState("");
const [packageGameFilter, setPackageGameFilter] = useState("All");
const [packageCategoryFilter, setPackageCategoryFilter] = useState("All");
const [showPackageForm, setShowPackageForm] = useState(false);

const packageGameOptions = Array.from(
  new Set(packages.map((pkg) => pkg.gameSlug).filter(Boolean))
);

const packageCategoryOptions = Array.from(
  new Set(
    packages.map((pkg) => pkg.category?.trim() || "General").filter(Boolean)
  )
);

const filteredPackages = packages.filter((pkg) => {
  const search = packageSearch.trim().toLowerCase();
  const category = pkg.category?.trim() || "General";

  const matchesSearch =
    !search ||
    pkg.name.toLowerCase().includes(search) ||
    pkg.gameName.toLowerCase().includes(search) ||
    pkg.gameSlug.toLowerCase().includes(search) ||
    category.toLowerCase().includes(search);

  const matchesGame =
    packageGameFilter === "All" || pkg.gameSlug === packageGameFilter;

  const matchesCategory =
    packageCategoryFilter === "All" || category === packageCategoryFilter;

  return matchesSearch && matchesGame && matchesCategory;
});

  // Wallet deposits
  const [deposits, setDeposits] = useState<DepositType[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [depositFilter, setDepositFilter] = useState("Pending");
  const [depositActionLoading, setDepositActionLoading] =
    useState<string | null>(null);

  // Wallet redeem codes
type RedeemCodeType = {
  _id: string;
  amount: number;
  status: "Active" | "Disabled" | "Redeemed";
  expiresAt?: string | null;
  redeemedAt?: string | null;
  createdAt?: string;
  adminNote?: string;
};

const [redeemCodes, setRedeemCodes] = useState<RedeemCodeType[]>([]);
const [redeemCodesLoading, setRedeemCodesLoading] = useState(false);
const [redeemAmount, setRedeemAmount] = useState("100");
const [redeemQuantity, setRedeemQuantity] = useState("1");
const [redeemExpiry, setRedeemExpiry] = useState("");
const [redeemAdminNote, setRedeemAdminNote] = useState("");
const [redeemCreating, setRedeemCreating] = useState(false);
const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
const [redeemStatusFilter, setRedeemStatusFilter] = useState("All");

  // UI messages
  const [topMessage, setTopMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ----------------------------------
  // HELPERS
  // ----------------------------------

  const showTopMessage = (
    type: "success" | "error",
    text: string
  ) => {
    setTopMessage({ type, text });
    setTimeout(() => setTopMessage(null), 3500);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // ----------------------------------
  // FETCH ORDERS
  // ----------------------------------

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);

      const res = await fetch(
        `/api/admin/orders?status=${encodeURIComponent(statusFilter)}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      const fetchedOrders = data.orders || [];
      setOrders(fetchedOrders);

      if (selectedOrder?._id) {
        const freshSelected = fetchedOrders.find(
          (order: OrderType) => order._id === selectedOrder._id
        );

        if (freshSelected) {
          setSelectedOrder(freshSelected);
          setAdminNoteInput(freshSelected.adminNote || "");
          setStatusInput(freshSelected.status || "Pending");
        } else {
          setSelectedOrder(null);
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load orders";
      console.error(error);
      showTopMessage("error", message);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ----------------------------------
  // FETCH GAMES
  // ----------------------------------

  const fetchGames = async () => {
    try {
      setGamesLoading(true);

      const res = await fetch("/api/admin/games", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch games");
      }

      setGames(data.games || []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load games";
      console.error(error);
      showTopMessage("error", message);
    } finally {
      setGamesLoading(false);
    }
  };

  const resetGameForm = () => {
    setGameName("");
    setGameSlug("");
    setGameDesc("");
    setGameImage("");
    setEditingGame(null);
  };

  const saveGame = async () => {
    if (!gameName.trim() || !gameSlug.trim()) {
      showTopMessage("error", "Game name and slug required");
      return;
    }

    try {
      const url = editingGame
        ? "/api/admin/games/update"
        : "/api/admin/games";

      const method = editingGame ? "PATCH" : "POST";

      const body = editingGame
        ? {
            gameId: editingGame,
            name: gameName.trim(),
            slug: gameSlug.trim(),
            desc: gameDesc,
            image: gameImage,
          }
        : {
            name: gameName.trim(),
            slug: gameSlug.trim(),
            desc: gameDesc,
            image: gameImage,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save game");
      }

      showTopMessage("success", data.message || "Game saved successfully");
      resetGameForm();
      await fetchGames();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save game";
      showTopMessage("error", message);
    }
  };

  const editGame = (game: GameType) => {
    setEditingGame(game._id);
    setGameName(game.name);
    setGameSlug(game.slug);
    setGameDesc(game.desc || "");
    setGameImage(game.image || "");
  };

  const deleteGame = async (id: string) => {
    if (!window.confirm("Delete this game?")) return;

    try {
      const res = await fetch("/api/admin/games/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gameId: id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete game");
      }

      showTopMessage("success", data.message || "Game deleted successfully");
      await fetchGames();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete game";
      showTopMessage("error", message);
    }
  };

  // ----------------------------------
  // FETCH PACKAGES
  // ----------------------------------

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);

      const res = await fetch("/api/admin/packages", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch packages");
      }

      setPackages(data.packages || []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load packages";
      console.error(error);
      showTopMessage("error", message);
    } finally {
      setPackagesLoading(false);
    }
  };



  const savePackage = async () => {
    if (
      !packageGameSlug ||
      !packageName.trim() ||
      !packagePrice.trim()
    ) {
      showTopMessage(
        "error",
        "Game, package name and price are required"
      );
      return;
    }

    try {
      setPackageSaving(true);

      const res = await fetch(
        editingPackage
          ? "/api/admin/packages/update"
          : "/api/admin/packages",
        {
          method: editingPackage ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...(editingPackage
              ? { packageId: editingPackage._id }
              : {}),
            gameSlug: packageGameSlug,
            name: packageName.trim(),
            category: packageCategory.trim() || "General",
            price: packagePrice.trim(),
            bonus: packageBonus.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save package"
        );
      }

      showTopMessage(
        "success",
        editingPackage
          ? "Package updated successfully"
          : "Package added successfully"
      );

      setPackageName("");
      setPackageCategory("General");
      setPackagePrice("");
      setPackageBonus("");
      setEditingPackage(null);

      await fetchPackages();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save package";

      showTopMessage("error", message);
    } finally {
      setPackageSaving(false);
    }
  };


  // ----------------------------------
  // FETCH WALLET DEPOSITS
  // ----------------------------------

  const fetchRedeemCodes = async () => {
    try {
      setRedeemCodesLoading(true);

      const res = await fetch("/api/admin/wallet/redeem-codes", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load redeem codes");
      }

      setRedeemCodes(data.codes || []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load redeem codes";
      showTopMessage("error", message);
    } finally {
      setRedeemCodesLoading(false);
    }
  };

  const createRedeemCodes = async () => {
    try {
      setRedeemCreating(true);
      setGeneratedCodes([]);

      const res = await fetch("/api/admin/wallet/redeem-codes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(redeemAmount),
          quantity: Number(redeemQuantity),
          expiresAt: redeemExpiry
            ? new Date(redeemExpiry).toISOString()
            : null,
          adminNote: redeemAdminNote,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create redeem codes");
      }

      const codes = (data.codes || []).map(
        (item: { code: string }) => item.code
      );

      setGeneratedCodes(codes);
      showTopMessage(
        "success",
        `Created ${codes.length} redeem code(s). Copy and save them now.`
      );

      await fetchRedeemCodes();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create redeem codes";
      showTopMessage("error", message);
    } finally {
      setRedeemCreating(false);
    }
  };

  const fetchDeposits = async () => {
    try {
      setDepositsLoading(true);

      const res = await fetch(
        `/api/admin/wallet/deposits?status=${encodeURIComponent(depositFilter)}`,
        { credentials: "include" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch deposits");
      }

      setDeposits(data.deposits || []);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load deposits";
      showTopMessage("error", message);
    } finally {
      setDepositsLoading(false);
    }
  };

  // ----------------------------------
  // REVIEW WALLET DEPOSIT
  // ----------------------------------

  const handleReviewDeposit = async (
    deposit: DepositType,
    decision: "Approved" | "Rejected"
  ) => {
    const confirmed = window.confirm(
      decision === "Approved"
        ? `Approve Rs. ${deposit.amount} deposit? Verify the actual payment first.`
        : `Reject the Rs. ${deposit.amount} deposit request?`
    );

    if (!confirmed) return;

    const note = window.prompt(
      decision === "Approved"
        ? "Admin note (e.g. payment verified):"
        : "Reason for rejection:"
    );

    if (note === null) return;

    if (decision === "Rejected" && !note.trim()) {
      showTopMessage("error", "Please enter a rejection reason.");
      return;
    }

    try {
      setDepositActionLoading(deposit.id);

      const res = await fetch(
        `/api/admin/wallet/deposits/${encodeURIComponent(deposit.id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: decision,
            adminNote: note.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to review deposit");
      }

      showTopMessage(
        "success",
        data.message ||
          (decision === "Approved"
            ? "Deposit approved"
            : "Deposit rejected")
      );

      await fetchDeposits();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to review deposit";

      showTopMessage("error", message);
      await fetchDeposits();
    } finally {
      setDepositActionLoading(null);
    }
  };

  // ----------------------------------
  // EFFECTS
  // ----------------------------------



  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    fetchGames();
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "wallet") {
      fetchDeposits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, depositFilter]);

  useEffect(() => {
    if (activeTab === "redeem") {
      fetchRedeemCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  // ----------------------------------
  // ORDER HELPERS AND ACTIONS
  // ----------------------------------

  const openOrderDetails = (order: OrderType) => {
    setSelectedOrder(order);
    setAdminNoteInput(order.adminNote || "");
    setStatusInput(order.status || "Pending");
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      return (
        order._id?.toLowerCase().includes(q) ||
        order.phone?.toLowerCase().includes(q) ||
        order.uid?.toLowerCase().includes(q) ||
        order.nickname?.toLowerCase().includes(q) ||
        order.game?.toLowerCase().includes(q)
      );
    });
  }, [orders, orderSearch]);

  const handleUpdateOrder = async () => {
    if (!selectedOrder?._id) return;

    try {
      setOrderActionLoading(true);

      const res = await fetch("/api/admin/orders/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: selectedOrder._id,
          status: statusInput,
          adminNote: adminNoteInput,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update order");
      }

      showTopMessage("success", "Order updated successfully");
      await fetchOrders();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update order";
      console.error(error);
      showTopMessage("error", message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder?._id) return;

    const confirmed = window.confirm(
      `Delete order for ${selectedOrder.nickname || "customer"}?`
    );

    if (!confirmed) return;

    try {
      setOrderActionLoading(true);

      const res = await fetch("/api/admin/orders/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId: selectedOrder._id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete order");
      }

      showTopMessage("success", "Order deleted successfully");
      setSelectedOrder(null);
      setAdminNoteInput("");
      setStatusInput("Pending");
      await fetchOrders();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete order";
      console.error(error);
      showTopMessage("error", message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  // ----------------------------------
  // UI
  // ----------------------------------

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* HEADER */}
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                TopupCenter
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm text-slate-400 md:text-base">
                Manage orders, games, packages and wallet deposits.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("orders")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "orders"
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500/40"
                }`}
              >
                Orders
              </button>

              <button
                onClick={() => setActiveTab("games")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "games"
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500/40"
                }`}
              >
                Games
              </button>

              <button
                onClick={() => setActiveTab("packages")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "packages"
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500/40"
                }`}
              >
                Packages
              </button>

              <button
                onClick={() => setActiveTab("wallet")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === "wallet"
                    ? "bg-cyan-500 text-slate-950"
                    : "border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500/40"
                }`}
              >
                Wallet Deposits

              </button>

<button
  onClick={() => setActiveTab("redeem")}
  className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
    activeTab === "redeem"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
  }`}
>
  Redeem Codes
</button>


              <button
                onClick={handleLogout}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                Logout
              </button>
            </div>
          </div>

          {topMessage ? (
            <div
              role="status"
              className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
                topMessage.type === "success"
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              {topMessage.text}
            </div>
          ) : null}
        </div>


        {/* ORDERS TAB */}
        {activeTab === "orders" ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Orders</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Search, review and manage customer orders.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Filter by status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    >
                      <option value="All">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Search order
                    </label>
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Order ID / Phone / UID / Nickname"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                {ordersLoading ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                    Loading orders...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                    No orders found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <button
                        key={order._id}
                        onClick={() => openOrderDetails(order)}
                        className={`w-full rounded-3xl border p-4 text-left transition ${
                          selectedOrder?._id === order._id
                            ? "border-cyan-500/50 bg-cyan-500/10"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {order.game}
                              </h3>
                              <StatusBadge status={order.status} />
                            </div>

                            <p className="mt-1 text-sm text-slate-400">
                              {order.package} â€¢ {order.price}
                            </p>

                            <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                              <p>
                                <span className="text-slate-500">Nickname:</span>{" "}
                                {order.nickname}
                              </p>
                              <p>
                                <span className="text-slate-500">UID:</span>{" "}
                                {order.uid}
                              </p>
                              <p>
                                <span className="text-slate-500">Phone:</span>{" "}
                                {order.phone}
                              </p>
                              <p className="break-all">
                                <span className="text-slate-500">Order ID:</span>{" "}
                                {order._id}
                              </p>
                            </div>

                            {(order.transactionId || order.customerNote) && (
                              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                                  <p className="text-xs text-slate-500">
                                    Transaction ID
                                  </p>
                                  <p className="mt-1 break-all text-slate-200">
                                    {order.transactionId || "Not provided"}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                                  <p className="text-xs text-slate-500">
                                    Customer Note
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-slate-200">
                                    {order.customerNote || "No note"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right text-xs text-slate-500">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* SELECTED ORDER */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
              <div>
                <h2 className="text-2xl font-bold">Order Details</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Select an order to review and update it.
                </p>
              </div>

              {!selectedOrder ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-slate-400">
                  Select an order from the left side to see full details.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold">
                        {selectedOrder.game}
                      </h3>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    <p className="mt-1 text-slate-400">
                      {selectedOrder.package} â€¢ {selectedOrder.price}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBox label="Order ID" value={selectedOrder._id} />
                    <InfoBox
                      label="Placed On"
                      value={formatDate(selectedOrder.createdAt)}
                    />
                    <InfoBox label="UID" value={selectedOrder.uid} />
                    <InfoBox label="Nickname" value={selectedOrder.nickname} />
                    <InfoBox label="Phone" value={selectedOrder.phone} />
                    <InfoBox
                      label="Payment Method"
                      value={selectedOrder.paymentMethod || "N/A"}
                    />
                    <InfoBox
                      label="Transaction ID"
                      value={selectedOrder.transactionId || "Not provided"}
                    />
                    <InfoBox
                      label="Current Status"
                      value={selectedOrder.status || "Pending"}
                    />
                  </div>

                  <TextBox
                    label="Customer Note"
                    value={
                      selectedOrder.customerNote ||
                      "No customer note provided."
                    }
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Update Status
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    >
                      {ORDER_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Admin Note
                    </label>
                    <textarea
                      rows={5}
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="Write admin note, payment confirmation, issue details, etc."
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={handleUpdateOrder}
                      disabled={orderActionLoading}
                      className="flex-1 rounded-2xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                    >
                      {orderActionLoading ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      onClick={handleDeleteOrder}
                      disabled={orderActionLoading}
                      className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
                    >
                      Delete Order
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {/* GAMES TAB */}
        {activeTab === "games" ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Games</h2>
              <p className="mt-1 text-sm text-slate-400">
                Current games available in the system.
              </p>
            </div>

            <div className="mb-8 mt-6 rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
              <h3 className="mb-4 text-xl font-bold">
                {editingGame ? "Edit Game" : "Add New Game"}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Game Name"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                />

                <input
                  type="text"
                  placeholder="Slug"
                  value={gameSlug}
                  onChange={(e) => setGameSlug(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
                />

                <input
                  type="text"
                  placeholder="Image URL"
                  value={gameImage}
                  onChange={(e) => setGameImage(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400 md:col-span-2"
                />

                <textarea
                  rows={4}
                  placeholder="Description"
                  value={gameDesc}
                  onChange={(e) => setGameDesc(e.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400 md:col-span-2"
                />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={saveGame}
                  className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-900 hover:bg-cyan-400"
                >
                  {editingGame ? "Update Game" : "Add Game"}
                </button>

                {editingGame && (
                  <button
                    onClick={resetGameForm}
                    className="rounded-2xl border border-slate-700 px-6 py-3 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {gamesLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                Loading games...
              </div>
            ) : games.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                No games found.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {games.map((game) => (
                  <div
                    key={game._id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5"
                  >
                    {game.image && (
                      <img
                        src={game.image}
                        alt={game.name}
                        className="mb-4 h-24 w-24 rounded-2xl object-cover"
                      />
                    )}

                    <h3 className="text-xl font-bold">{game.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Slug: {game.slug}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      {game.desc || "No description"}
                    </p>

                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={() => editGame(game)}
                        className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteGame(game._id)}
                        className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}



        {/* PACKAGES TAB */}
        {activeTab === "packages" ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Packages Management</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add, edit, search and manage packages by game and category.
                </p>
              </div>

              <span className="w-fit rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                {packages.length} packages
              </span>
            </div>

            {/* ADD / EDIT PACKAGE FORM */}
            <div className="mb-8 rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
              <h3 className="mb-5 text-xl font-bold">
                {editingPackage ? "Edit Package" : "Add New Package"}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Game *
                  </label>
                  <select
                    value={packageGameSlug}
                    onChange={(e) => setPackageGameSlug(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option value="">Select Game</option>
                    {games.map((game) => (
                      <option key={game._id} value={game.slug}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Package Name *
                  </label>
                  <input
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. 60 UC, 100 Diamonds"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Category *
                  </label>
                  <input
                    value={packageCategory}
                    onChange={(e) => setPackageCategory(e.target.value)}
                    placeholder="e.g. UC, Diamonds, Weekly, Membership"
                    className="w-full rounded-2xl border border-cyan-500/50 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Packages with the same category appear in the same tab.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-300">
                    Bonus (optional)
                  </label>
                  <input
                    value={packageBonus}
                    onChange={(e) => setPackageBonus(e.target.value)}
                    placeholder="e.g. Bonus diamonds"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={savePackage}
                  disabled={packageSaving}
                  className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {packageSaving
                    ? "Saving..."
                    : editingPackage
                      ? "Update Package"
                      : "Add Package"}
                </button>

                {editingPackage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPackage(null);
                      setPackageGameSlug("");
                      setPackageName("");
                      setPackageCategory("General");
                      setPackagePrice("");
                      setPackageBonus("");
                    }}
                    className="rounded-2xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {/* PACKAGE LIST */}
            <div className="mb-5 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold">Game Package Management</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {filteredPackages.length} of {packages.length} packages
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchPackages}
                  disabled={packagesLoading}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 disabled:opacity-60"
                >
                  {packagesLoading ? "Loading..." : "Refresh Packages"}
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={packageSearch}
                  onChange={(event) => setPackageSearch(event.target.value)}
                  placeholder="Search package or game..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                />
                <select
                  value={packageGameFilter}
                  onChange={(event) => setPackageGameFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                >
                  <option value="All">All games</option>
                  {packageGameOptions.map((slug) => (
                    <option key={slug} value={slug}>
                      {packages.find((pkg) => pkg.gameSlug === slug)?.gameName || slug}
                    </option>
                  ))}
                </select>
                <select
                  value={packageCategoryFilter}
                  onChange={(event) => setPackageCategoryFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                >
                  <option value="All">All categories</option>
                  {packageCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {packagesLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                Loading packages...
              </div>
            ) : packages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-400">
                No packages found. Add your first package above.
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-slate-400">
                No packages match your search or filters.
              </div>
            ) : (
              <div className="space-y-6">
                {packageGameOptions
                  .filter((slug) => filteredPackages.some((pkg) => pkg.gameSlug === slug))
                  .filter((slug) => packageGameFilter === "All" || slug === packageGameFilter)
                  .map((slug) => {
                    const gamePackages = filteredPackages
                      .filter((pkg) => pkg.gameSlug === slug)
                      .sort((a, b) => {
                        const orderA = a.sortOrder ?? 0;
                        const orderB = b.sortOrder ?? 0;
                        if (orderA !== orderB) return orderA - orderB;
                        return packages.findIndex((item) => item._id === a._id) -
                          packages.findIndex((item) => item._id === b._id);
                      });

                    const gameName = gamePackages[0]?.gameName || slug;

                    return (
                      <section
                        key={slug}
                        className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 md:p-5"
                      >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div>
                            <h4 className="text-lg font-bold">{gameName}</h4>
                            <p className="text-xs text-slate-500">{slug}</p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                            {gamePackages.length} shown
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {gamePackages.map((pkg) => {
                            const available = pkg.active !== false;
                            const allInGame = packages
                              .filter((item) => item.gameSlug === slug)
                              .sort((a, b) => {
                                const orderA = a.sortOrder ?? 0;
                                const orderB = b.sortOrder ?? 0;
                                if (orderA !== orderB) return orderA - orderB;
                                return packages.findIndex((item) => item._id === a._id) -
                                  packages.findIndex((item) => item._id === b._id);
                              });
                            const currentIndex = allInGame.findIndex((item) => item._id === pkg._id);
                            const filteredMode = packageSearch.trim() !== "" ||
                              packageCategoryFilter !== "All";

                            const changeAvailability = async () => {
                              try {
                                const res = await fetch("/api/admin/packages/availability", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({
                                    packageId: pkg._id,
                                    active: !available,
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok || !data.success) {
                                  throw new Error(data.message || "Could not update stock");
                                }
                                setPackages((current) =>
                                  current.map((item) =>
                                    item._id === pkg._id
                                      ? { ...item, active: !available }
                                      : item
                                  )
                                );
                                showTopMessage("success", data.message || "Stock updated");
                              } catch (error: unknown) {
                                showTopMessage(
                                  "error",
                                  error instanceof Error ? error.message : "Could not update stock"
                                );
                              }
                            };

                            const movePackage = async (direction: -1 | 1) => {
                              if (filteredMode) {
                                showTopMessage(
                                  "error",
                                  "Clear search and category filter before changing package order."
                                );
                                return;
                              }

                              const targetIndex = currentIndex + direction;
                              if (currentIndex < 0 || targetIndex < 0 || targetIndex >= allInGame.length) {
                                return;
                              }

                              const reordered = [...allInGame];
                              [reordered[currentIndex], reordered[targetIndex]] =
                                [reordered[targetIndex], reordered[currentIndex]];

                              const orderPayload = reordered.map((item, index) => ({
                                id: item._id,
                                sortOrder: index,
                              }));

                              try {
                                const res = await fetch("/api/admin/packages/reorder", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  credentials: "include",
                                  body: JSON.stringify({ packages: orderPayload }),
                                });
                                const data = await res.json();
                                if (!res.ok || !data.success) {
                                  throw new Error(data.message || "Failed to save package order");
                                }

                                setPackages((current) =>
                                  current.map((item) => {
                                    const ordered = orderPayload.find((entry) => entry.id === item._id);
                                    return ordered ? { ...item, sortOrder: ordered.sortOrder } : item;
                                  })
                                );
                                showTopMessage("success", "Package order saved");
                                await fetchPackages();
                              } catch (error: unknown) {
                                showTopMessage(
                                  "error",
                                  error instanceof Error ? error.message : "Failed to reorder packages"
                                );
                              }
                            };

                            return (
                              <div
                                key={pkg._id}
                                className={`rounded-2xl border p-4 transition ${
                                  available
                                    ? "border-slate-700 bg-slate-950/70 hover:border-cyan-500/40"
                                    : "border-rose-500/30 bg-rose-950/20 opacity-80"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h5 className="font-bold">{pkg.name}</h5>
                                    <p className="mt-1 text-xs text-slate-400">
                                      {pkg.category || "General"}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                      available
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : "bg-rose-500/10 text-rose-300"
                                    }`}
                                  >
                                    {available ? "Available" : "Out of stock"}
                                  </span>
                                </div>

                                <p className="mt-4 text-2xl font-bold text-emerald-300">
                                  Rs. {pkg.price}
                                </p>
                                <p className="mt-1 text-sm text-slate-300">
                                  Bonus: {pkg.bonus || "None"}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={changeAvailability}
                                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                                      available
                                        ? "border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                                        : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                                    }`}
                                  >
                                    {available ? "Mark Stock Out" : "Mark Available"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => movePackage(-1)}
                                    disabled={currentIndex <= 0 || filteredMode}
                                    title={filteredMode ? "Clear search and category filters first" : "Move up"}
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    ↑ Up
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => movePackage(1)}
                                    disabled={currentIndex < 0 || currentIndex >= allInGame.length - 1 || filteredMode}
                                    title={filteredMode ? "Clear search and category filters first" : "Move down"}
                                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    ↓ Down
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPackage(pkg);
                                      setPackageGameSlug(pkg.gameSlug);
                                      setPackageName(pkg.name);
                                      setPackageCategory(pkg.category || "General");
                                      setPackagePrice(pkg.price);
                                      setPackageBonus(pkg.bonus || "");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="rounded-lg border border-cyan-500/40 px-3 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const confirmed = window.confirm(
                                        `Delete "${pkg.name}"? This cannot be undone.`
                                      );
                                      if (!confirmed) return;

                                      try {
                                        const res = await fetch("/api/admin/packages/delete", {
                                          method: "DELETE",
                                          headers: { "Content-Type": "application/json" },
                                          credentials: "include",
                                          body: JSON.stringify({ packageId: pkg._id }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok || !data.success) {
                                          throw new Error(data.message || "Failed to delete package");
                                        }
                                        if (editingPackage?._id === pkg._id) {
                                          setEditingPackage(null);
                                          setPackageGameSlug("");
                                          setPackageName("");
                                          setPackageCategory("General");
                                          setPackagePrice("");
                                          setPackageBonus("");
                                        }
                                        showTopMessage("success", "Package deleted successfully");
                                        await fetchPackages();
                                      } catch (error: unknown) {
                                        showTopMessage(
                                          "error",
                                          error instanceof Error ? error.message : "Failed to delete package"
                                        );
                                      }
                                    }}
                                    className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
              </div>
            )}
          </section>
        ) : null}

        {/* WALLET DEPOSITS TAB */}
        {activeTab === "wallet" ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Wallet Deposits</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Verify customer payments before approving wallet credits.
                </p>
              </div>

              <button
                onClick={fetchDeposits}
                disabled={depositsLoading}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 disabled:opacity-60"
              >
                {depositsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className="mt-5">
              <label
                htmlFor="deposit-filter"
                className="mb-2 block text-sm text-slate-300"
              >
                Filter deposits
              </label>

              <select
                id="deposit-filter"
                value={depositFilter}
                onChange={(e) => setDepositFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white sm:max-w-xs"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="All">All</option>
              </select>
            </div>

            <div className="mt-6 space-y-4">
              {depositsLoading ? (
                <div className="rounded-2xl border border-slate-800 p-6 text-center text-slate-400">
                  Loading deposit requests...
                </div>
              ) : deposits.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 p-6 text-center text-slate-400">
                  No deposits found for this filter.
                </div>
              ) : (
                deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">
                          Deposit amount
                        </p>
                        <p className="mt-1 text-2xl font-bold text-cyan-300">
                          Rs.{" "}
                          {Number(deposit.amount).toLocaleString("en-NP")}
                        </p>

                        <p className="mt-2 text-sm text-slate-300">
                          {deposit.customer?.name || "Unknown customer"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {deposit.customer?.phone || "No phone"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {deposit.customer?.email || "No email"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                          deposit.status === "Pending"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : deposit.status === "Approved"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 p-3">
                        <p className="text-slate-500">Payment method</p>
                        <p className="mt-1">{deposit.paymentMethod}</p>
                      </div>

                      <div className="rounded-xl border border-slate-800 p-3">
                        <p className="text-slate-500">Transaction reference</p>
                        <p className="mt-1 break-all">
                          {deposit.transactionReference}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 p-3">
                        <p className="text-slate-500">Submitted on</p>
                        <p className="mt-1">
                          {formatDate(deposit.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 p-3">
                        <p className="text-slate-500">Deposit ID</p>
                        <p className="mt-1 break-all">{deposit.id}</p>
                      </div>
                    </div>

                    {deposit.adminNote ? (
                      <p className="mt-3 break-words text-sm text-slate-400">
                        Admin note: {deposit.adminNote}
                      </p>
                    ) : null}

                    {deposit.status === "Pending" ? (
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          onClick={() =>
                            handleReviewDeposit(deposit, "Approved")
                          }
                          disabled={depositActionLoading !== null}
                          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {depositActionLoading === deposit.id
                            ? "Processing..."
                            : "Approve Deposit"}
                        </button>

                        <button
                          onClick={() =>
                            handleReviewDeposit(deposit, "Rejected")
                          }
                          disabled={depositActionLoading !== null}
                          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          {depositActionLoading === deposit.id
                            ? "Processing..."
                            : "Reject Deposit"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {/* REDEEM CODES TAB */}
        {activeTab === "redeem" ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Wallet Redeem Codes</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Generate prepaid codes that customers can redeem into their
                  TopupCenter wallet.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchRedeemCodes}
                disabled={redeemCodesLoading}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400 disabled:opacity-60"
              >
                {redeemCodesLoading ? "Loading..." : "Refresh Codes"}
              </button>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
              <h3 className="mb-4 text-lg font-bold">Generate New Codes</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Quantity (1â€“100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={redeemQuantity}
                    onChange={(e) => setRedeemQuantity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Expiry date (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={redeemExpiry}
                    onChange={(e) => setRedeemExpiry(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Admin note (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={redeemAdminNote}
                    onChange={(e) => setRedeemAdminNote(e.target.value)}
                    placeholder="e.g. Dashain promotion"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={createRedeemCodes}
                disabled={
                  redeemCreating ||
                  !Number.isInteger(Number(redeemAmount)) ||
                  Number(redeemAmount) < 1 ||
                  Number(redeemAmount) > 100000 ||
                  !Number.isInteger(Number(redeemQuantity)) ||
                  Number(redeemQuantity) < 1 ||
                  Number(redeemQuantity) > 100
                }
                className="mt-5 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {redeemCreating ? "Generating..." : "Generate Redeem Codes"}
              </button>
            </div>

            {generatedCodes.length > 0 ? (
              <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                <h3 className="text-lg font-bold text-emerald-300">
                  Newly Generated Codes
                </h3>
                <p className="mt-2 text-sm text-amber-300">
                  Important: Copy and securely save these codes now. They will
                  not be displayed again after you leave this page.
                </p>

                <textarea
                  readOnly
                  value={generatedCodes.join("\n")}
                  rows={Math.min(generatedCodes.length, 10)}
                  className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-sm text-white"
                />

                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(generatedCodes.join("\n"))
                      .then(() => {
                        showTopMessage("success", "Redeem codes copied.");
                      })
                      .catch(() => {
                        showTopMessage(
                          "error",
                          "Copy failed. Select the codes and copy them manually."
                        );
                      });
                  }}
                  className="mt-3 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                >
                  Copy All Codes
                </button>
              </div>
            ) : null}

            <div className="mt-8">
              <h3 className="mb-4 text-xl font-bold">Previously Generated Codes</h3>

              {redeemCodesLoading ? (
                <p className="rounded-2xl border border-slate-800 p-5 text-center text-slate-400">
                  Loading redeem codes...
                </p>
              ) : redeemCodes.length === 0 ? (
                <p className="rounded-2xl border border-slate-800 p-5 text-center text-slate-400">
                  No redeem codes found. Generate your first batch above.
                </p>
              ) : (
                <div className="space-y-3">
                  {redeemCodes.map((code) => (
                    <div
                      key={code._id || `${code.amount}-${code.createdAt}`}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold">
                          Rs. {Number(code.amount).toLocaleString("en-NP")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Created:{" "}
                          {code.createdAt
                            ? formatDate(code.createdAt)
                            : "Unknown"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Expires:{" "}
                          {code.expiresAt
                            ? formatDate(code.expiresAt)
                            : "Never"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                          code.status === "Active"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : code.status === "Redeemed"
                              ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                              : "border-slate-600 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {code.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

      </div>
    </main>
  );
}