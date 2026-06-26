import Link from "next/link";
import Navbar from "@/components/Navbar";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";

type GameItem = {
  _id: string;
  name: string;
  slug: string;
  desc?: string;
  image?: string;
};

export default async function GamesPage() {
  await dbConnect();

  const games = (await Game.find({ active: true })
    .sort({ createdAt: -1 })
    .lean()) as GameItem[];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            All Games
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Choose your game
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
            Browse available games and open the topup page for live packages.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        {games.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <h3 className="text-xl font-semibold">No games available</h3>
            <p className="mt-2 text-sm text-slate-400">
              Add games from admin panel to display them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => (
              <div
                key={game._id.toString()}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-950/40"
              >
                <div className="relative h-56 overflow-hidden">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-semibold">{game.name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                    {game.desc || `Topup ${game.name} instantly from our store.`}
                  </p>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {game.slug}
                    </span>

                    <Link
                      href={`/topup/${game.slug}`}
                      className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      Open Topup
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}