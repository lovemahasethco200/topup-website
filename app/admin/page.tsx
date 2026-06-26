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
  price: string;
  bonus?: string;
};

const ORDER_STATUS_OPTIONS = ["Pending", "Processing", "Completed", "Cancelled"];

export default function AdminPage() {
  const router = useRouter();

  // top tabs
  const [activeTab, setActiveTab] = useState<"orders" | "games" | "packages">(
    "orders"
  );

  // orders
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [statusInput, setStatusInput] = useState("Pending");

  // games
  const [games, setGames] = useState<GameType[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // games form
const [gameName, setGameName] = useState("");
const [gameSlug, setGameSlug] = useState("");
const [gameDesc, setGameDesc] = useState("");
const [gameImage, setGameImage] = useState("");
const [editingGame, setEditingGame] = useState<string | null>(null);

  // packages
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // UI messages
  const [topMessage, setTopMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ----------------------------------
  // FETCHERS
  // ----------------------------------
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);

      const res = await fetch(`/api/admin/orders?status=${statusFilter}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      const fetchedOrders = data.orders || [];
      setOrders(fetchedOrders);

      // keep selected order synced
      if (selectedOrder?._id) {
        const freshSelected = fetchedOrders.find(
          (o: OrderType) => o._id === selectedOrder._id
        );
        if (freshSelected) {
          setSelectedOrder(freshSelected);
          setAdminNoteInput(freshSelected.adminNote || "");
          setStatusInput(freshSelected.status || "Pending");
        } else {
          setSelectedOrder(null);
        }
      }
    } catch (error: any) {
      console.error(error);
      showTopMessage("error", error.message || "Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

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
    } catch (error: any) {
      console.error(error);
      showTopMessage("error", error.message || "Failed to load games");
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
  if (!gameName || !gameSlug) {
    showTopMessage("error", "Game name and slug required");
    return;
  }

  const url = editingGame
    ? "/api/admin/games/update"
    : "/api/admin/games";

  const method = editingGame ? "PATCH" : "POST";

  const body = editingGame
    ? {
        gameId: editingGame,
        name: gameName,
        slug: gameSlug,
        desc: gameDesc,
        image: gameImage,
      }
    : {
        name: gameName,
        slug: gameSlug,
        desc: gameDesc,
        image: gameImage,
      };

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.success) {
    showTopMessage("error", data.message);
    return;
  }

  showTopMessage("success", data.message);

  resetGameForm();

  fetchGames();
};

const editGame = (game: GameType) => {
  setEditingGame(game._id);

  setGameName(game.name);

  setGameSlug(game.slug);

  setGameDesc(game.desc || "");

  setGameImage(game.image || "");
};

const deleteGame = async (id: string) => {
  if (!confirm("Delete this game?")) return;

  const res = await fetch("/api/admin/games/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      gameId: id,
    }),
  });

  const data = await res.json();

  if (!data.success) {
    showTopMessage("error", data.message);
    return;
  }

  showTopMessage("success", data.message);

  fetchGames();
};

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
    } catch (error: any) {
      console.error(error);
      showTopMessage("error", error.message || "Failed to load packages");
    } finally {
      setPackagesLoading(false);
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

  // ----------------------------------
  // HELPERS
  // ----------------------------------
  const showTopMessage = (type: "success" | "error", text: string) => {
    setTopMessage({ type, text });
    setTimeout(() => {
      setTopMessage(null);
    }, 2500);
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

  // ----------------------------------
  // ORDER ACTIONS
  // ----------------------------------
  const handleUpdateOrder = async () => {
    if (!selectedOrder?._id) return;

    try {
      setOrderActionLoading(true);

      const res = await fetch("/api/admin/orders/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (error: any) {
      console.error(error);
      showTopMessage("error", error.message || "Failed to update order");
    } finally {
      setOrderActionLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder?._id) return;

    const ok = window.confirm(
      `Delete order for ${selectedOrder.nickname || "customer"}?`
    );
    if (!ok) return;

    try {
      setOrderActionLoading(true);

      const res = await fetch("/api/admin/orders/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          orderId: selectedOrder._id,
        }),
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
    } catch (error: any) {
      console.error(error);
      showTopMessage("error", error.message || "Failed to delete order");
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
                Manage orders, games and packages from one secure dashboard.
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
                onClick={handleLogout}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                Logout
              </button>
            </div>
          </div>

          {topMessage ? (
            <div
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
            {/* LEFT: Orders List */}
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
                              {order.package} • {order.price}
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

            {/* RIGHT: Selected Order Panel */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Select an order to review and update it.
                  </p>
                </div>
              </div>

              {!selectedOrder ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-slate-400">
                  Select an order from the left side to see full details.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold">{selectedOrder.game}</h3>
                      <StatusBadge status={selectedOrder.status} />
                    </div>
                    <p className="mt-1 text-slate-400">
                      {selectedOrder.package} • {selectedOrder.price}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoBox label="Order ID" value={selectedOrder._id} />
                    <InfoBox label="Placed On" value={formatDate(selectedOrder.createdAt)} />
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
                    value={selectedOrder.customerNote || "No customer note provided."}
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

            <div className="mt-6 mb-8 rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
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
            <div className="mb-5">
              <h2 className="text-2xl font-bold">Packages</h2>
              <p className="mt-1 text-sm text-slate-400">
                Current package list stored in database.
              </p>
            </div>

            {packagesLoading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                Loading packages...
              </div>
            ) : packages.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center text-slate-400">
                No packages found.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((pkg) => (
                  <div
                    key={pkg._id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Game: {pkg.gameName}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Price: {pkg.price}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Bonus: {pkg.bonus || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

// ----------------------------------
// SMALL COMPONENTS
// ----------------------------------






function formatDate(date?: string) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
}