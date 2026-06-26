import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";
import PackageModel from "@/models/Package";

type TopupPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type GameDoc = {
  name: string;
  slug: string;
  desc?: string;
  image?: string;
};

type PackageDoc = {
  _id: string;
  name: string;
  price: string;
  bonus?: string;
  gameSlug: string;
  gameName: string;
};

export default async function TopupPage({ params }: TopupPageProps) {
  const { slug } = await params;

  await dbConnect();

  const game = (await Game.findOne({
    slug,
    active: true,
  }).lean()) as GameDoc | null;

  if (!game) {
    notFound();
  }

  const packages = (await PackageModel.find({
    gameSlug: slug,
    active: true,
  })
    .sort({ createdAt: 1 })
    .lean()) as PackageDoc[];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.22),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Instant Topup
              </p>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                {game.name}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                {game.desc || `Buy ${game.name} topup quickly and securely.`}
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-cyan-950/30">
              {game.image ? (
                <img
                  src={game.image}
                  alt={game.name}
                  className="h-64 w-full object-cover md:h-72"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center bg-slate-900 text-slate-400 md:h-72">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-400">
              Available Packages
            </p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Choose your package
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Select a package below and continue to checkout.
            </p>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <h3 className="text-xl font-semibold">No package found</h3>
            <p className="mt-2 text-sm text-slate-400">
              This game has no package added yet from admin panel.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg._id.toString()}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-950/40"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                <div className="relative flex h-full flex-col">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{pkg.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{game.name}</p>
                    </div>

                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-semibold text-cyan-300">
                      {pkg.price}
                    </span>
                  </div>

                  <div className="mb-5 flex-1">
                    <p className="text-sm leading-6 text-slate-300">
                      {pkg.bonus && pkg.bonus.trim() !== ""
                        ? pkg.bonus
                        : `Topup ${pkg.name} for ${game.name}. Fast processing and secure order handling.`}
                    </p>
                  </div>

                  <Link
                    href={`/checkout?game=${encodeURIComponent(
                      game.name
                    )}&package=${encodeURIComponent(
                      pkg.name
                    )}&price=${encodeURIComponent(pkg.price)}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}