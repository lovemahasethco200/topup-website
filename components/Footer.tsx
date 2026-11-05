
import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Games", href: "/games" },
  { label: "Track Order", href: "/track-order" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="mt-12 overflow-hidden border-t border-white/10 bg-slate-950 sm:mt-16">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div className="min-w-0 sm:col-span-2 lg:col-span-2">
          <Link href="/" className="inline-flex max-w-full items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
              T
            </span>

            <span className="min-w-0">
              <span className="block text-xl font-extrabold text-white">
                TopupCenter
              </span>
              <span className="mt-1 block text-sm leading-5 text-slate-400">
                Fast, trusted and affordable gaming top-up in Nepal.
              </span>
            </span>
          </Link>

          <p className="mt-5 max-w-xl break-words text-sm leading-7 text-slate-400">
            Explore Free Fire diamonds, PUBG UC, Mobile Legends diamonds and
            other available game top-up packages. Choose your package, follow
            the checkout instructions, and track your order online.
          </p>
        </div>

        {/* Quick Links */}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white sm:text-lg">
            Quick Links
          </h2>

          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-1">
            {quickLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded py-1 text-slate-400 transition-colors hover:text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white sm:text-lg">
            Support
          </h2>

          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <li className="break-words">eSewa / Khalti / IME Pay</li>
            <li className="break-words">Top-up order assistance</li>
            <li className="break-words">Order status tracking</li>
            <li className="break-words">Manual top-up support</li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs leading-5 text-slate-500 sm:px-6 sm:text-sm lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} TopupCenter. All rights reserved.
          </p>

          <p className="break-words">
            Built for your gaming top-up needs.
          </p>
        </div>
      </div>
    </footer>
  );
}