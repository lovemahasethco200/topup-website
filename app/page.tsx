import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";

const features = [
  {
    icon: "⚡",
    title: "Simple Ordering",
    desc: "Choose your game and package, then follow the order instructions.",
  },
  {
    icon: "🎮",
    title: "Popular Games",
    desc: "Explore available games and find the top-up package you need.",
  },
  {
    icon: "🔎",
    title: "Order Tracking",
    desc: "Check your order status using the order tracking page.",
  },
  {
    icon: "🛡️",
    title: "Order Review",
    desc: "Orders can be reviewed before fulfillment when necessary.",
  },
];

export default async function HomePage() {
  let games: any[] = [];

  try {
    await dbConnect();

    const result = await Game.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    games = JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error("Home page game loading failed:", error);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b16] text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.18),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.16),transparent_40%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Welcome to TopupCenter
            </div>

            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              Your Game.
              <br />
              Your Rules.
              <span className="mt-2 block bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Your Victory.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Find your favorite games, explore available top-up packages,
              and manage your orders in one convenient place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/games"
                className="rounded-2xl bg-cyan-400 px-7 py-4 text-center font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Explore Games <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/track-order"
                className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center font-semibold transition hover:bg-white/10"
              >
                Track My Order
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                🎮 Multiple Games
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                📦 Package Selection
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                🔎 Order Tracking
              </span>
            </div>
          </div>

          {/* HERO INFO CARD */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-cyan-500/20 to-violet-500/20 blur-2xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-[#101728]/90 p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                    GAMING STORE
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Level Up Your Game
                  </h2>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-3xl">
                  🎮
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="text-3xl">💎</span>
                  <h3 className="mt-3 font-bold">Game Diamonds</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Explore available packages
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <span className="text-3xl">🪙</span>
                  <h3 className="mt-3 font-bold">Game Coins & UC</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Choose your preferred top-up
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-2xl">
                      🔍
                    </div>
                    <div>
                      <h3 className="font-bold">Stay Updated on Your Order</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Visit the tracking page to check your order status.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/games"
                className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-4 font-bold text-slate-950 transition hover:brightness-110"
              >
                Start Exploring <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GAMES SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
              YOUR NEXT ADVENTURE
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Explore Popular Games
            </h2>
            <p className="mt-3 text-slate-400">
              Choose a game to explore its available top-up packages.
            </p>
          </div>

          <Link
            href="/games"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:border-cyan-400/40 hover:bg-white/10"
          >
            View All Games →
          </Link>
        </div>

        {games.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
            <div className="text-5xl">🎮</div>
            <h3 className="mt-5 text-xl font-bold">
              Games Coming Soon
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
              Available games will appear here. Please check the games page
              or come back later.
            </p>
            <Link
              href="/games"
              className="mt-6 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Browse Games
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {games.map((game: any) => (
              <article
                key={game._id}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-[#101728] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-xl hover:shadow-cyan-950/30"
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-violet-500/20">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-6xl transition duration-300 group-hover:scale-110">
                      🎮
                    </span>
                  )}

                  <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    Game Top-up
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold">{game.name}</h3>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">
                    {game.desc || "Explore available top-up packages."}
                  </p>

                  <Link
                    href={`/topup/${game.slug}`}
                    className="mt-5 flex items-center justify-center rounded-xl bg-white/5 px-4 py-3 text-sm font-bold transition group-hover:bg-cyan-400 group-hover:text-slate-950"
                  >
                    View Packages <span className="ml-2">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-400">
              WHY TOPUPCENTER
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              A Simpler Way to Top Up
            </h2>
            <p className="mt-4 leading-7 text-slate-400">
              Explore services, choose a package, and follow your order
              through a straightforward process.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-[#101728] p-6 transition hover:border-violet-400/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/10 text-2xl">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-[#101728] to-violet-500/10 p-7 sm:p-10 lg:p-14">
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                READY TO PLAY?
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-4xl">
                Find Your Game and Choose Your Package
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Explore the available games, review package details, and
                follow the instructions during checkout.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                href="/games"
                className="rounded-xl bg-cyan-400 px-6 py-4 text-center font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Browse Games →
              </Link>

              <Link
                href="/track-order"
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-4 text-center font-semibold transition hover:bg-white/10"
              >
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}