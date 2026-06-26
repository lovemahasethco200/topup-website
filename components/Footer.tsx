import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 font-black text-slate-950">
              T
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">TopupCenter</h3>
              <p className="text-sm text-slate-400">
                Fast, trusted and affordable gaming topup platform in Nepal.
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
            Buy Free Fire diamonds, PUBG UC, Mobile Legends diamonds and more
            with a smooth checkout experience. Track your order, manage topups,
            and grow your gaming recharge business professionally.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-white">Quick Links</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li>
              <Link href="/" className="hover:text-cyan-400">
                Home
              </Link>
            </li>
            <li>
              <Link href="/games" className="hover:text-cyan-400">
                Games
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="hover:text-cyan-400">
                Track Order
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-cyan-400">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-lg font-semibold text-white">Support</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li>eSewa / Khalti / IME Pay</li>
            <li>Fast Delivery</li>
            <li>Manual Topup Support</li>
            <li>Order Tracking System</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} TopupCenter. All rights reserved.</p>
          <p>Built for digital topup business growth.</p>
        </div>
      </div>
    </footer>
  );
}