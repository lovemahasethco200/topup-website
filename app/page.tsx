import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const games = [
  {
    name: "Free Fire",
    desc: "Instant diamond topup for Free Fire players with fast order processing.",
    href: "/topup/free-fire",
  },
  {
    name: "PUBG Mobile",
    desc: "Buy UC securely with simple checkout and fast support.",
    href: "/topup/pubg-mobile",
  },
  {
    name: "Mobile Legends",
    desc: "Recharge diamonds quickly and track your order anytime.",
    href: "/topup/mobile-legends",
  },
  {
    name: "Valorant",
    desc: "Topup Valorant Points with easy ordering and reliable service.",
    href: "/topup/valorant",
  },
];

const features = [
  {
    title: "Fast Order Processing",
    desc: "Orders are placed in seconds and managed smoothly through the admin panel.",
  },
  {
    title: "Trusted Payments",
    desc: "Accept eSewa, Khalti and IME Pay with a simple and professional checkout flow.",
  },
  {
    title: "Order Tracking",
    desc: "Customers can track orders using Order ID, phone number or game UID.",
  },
  {
    title: "Professional Admin Panel",
    desc: "Manage orders, games and packages from a central dashboard.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              Nepal Gaming Topup Platform
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              Fast & Trusted
              <span className="block text-cyan-400">Game Topup Website</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Buy diamonds, UC, gaming credits and topup packages with a clean,
              secure and professional experience. Track your orders, manage your
              business, and scale your digital topup service with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/games"
                className="rounded-2xl bg-cyan-500 px-6 py-3 text-center font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Browse Games
              </Link>
              <Link
                href="/track-order"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10"
              >
                Track Order
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Orders", value: "Fast" },
                { label: "Support", value: "Daily" },
                { label: "Payment", value: "Secure" },
                { label: "Tracking", value: "Live" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xl font-bold text-cyan-400">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero card */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                    Topup Dashboard
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Sell game topups professionally
                  </h2>
                </div>
                <div className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">
                  LIVE
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Instant checkout page for customers",
                  "Admin panel to manage orders & status",
                  "Track order page with Order ID / UID / phone",
                  "Game & package management system",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-300">
                  Your website is now built like a real topup platform, not just
                  a basic student project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GAMES */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
              Popular Games
            </p>
            <h2 className="mt-2 text-3xl font-bold">Topup your favorite game</h2>
          </div>

          <Link
            href="/games"
            className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            View all games
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {games.map((game) => (
            <div
              key={game.name}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/30"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl">
                🎮
              </div>
              <h3 className="mt-5 text-2xl font-bold">{game.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {game.desc}
              </p>

              <Link
                href={game.href}
                className="mt-6 inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Topup Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
            Why Choose Us
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Everything needed for a topup platform
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
            >
              <div className="mb-4 inline-flex rounded-2xl bg-cyan-500/15 px-3 py-2 text-cyan-400">
                ✓
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">
                Ready to start?
              </p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                Start taking topup orders professionally
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                Browse available games, place an order, and track the status
                anytime. Your website now has customer flow + admin flow + order
                tracking flow in one system.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                href="/games"
                className="rounded-2xl bg-cyan-500 px-6 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Explore Games
              </Link>
              <Link
                href="/admin"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-center font-semibold text-white hover:bg-white/10"
              >
                Open Admin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}