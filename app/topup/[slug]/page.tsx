
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import dbConnect from "@/lib/mongodb";
import Game from "@/models/Game";
import PackageModel from "@/models/Package";
import TopupPackageSelector from "@/components/TopupPackageSelector";

type TopupPageProps = {
  params: Promise<{ slug: string }>;
};

type GameDoc = {
  name: string;
  slug: string;
  desc?: string;
  image?: string;
};

type PackageDoc = {
  _id: { toString(): string };
  name: string;
  category?: string;
  price: string;
  bonus?: string;
};

export default async function TopupPage({ params }: TopupPageProps) {
  const { slug } = await params;

  await dbConnect();

  const game = (await Game.findOne({
    slug,
    active: true,
  }).lean()) as GameDoc | null;

  if (!game) notFound();

  const packageDocs = (await PackageModel.find({
    gameSlug: slug,
    active: true,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()) as PackageDoc[];

  const packages = packageDocs.map((pkg) => ({
    _id: pkg._id.toString(),
    name: pkg.name,
    category: pkg.category || "General",
    price: pkg.price,
    bonus: pkg.bonus || "",
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.22),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:grid-cols-[1.2fr_0.8fr] md:px-6 md:py-16">
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
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-400">
            Available Packages
          </p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Choose your packages
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Select multiple variants and quantities, then pay once at checkout.
          </p>
        </div>

        <TopupPackageSelector
          gameName={game.name}
          packages={packages}
        />
      </section>
    </main>
  );
}
