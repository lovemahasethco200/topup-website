
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Games", href: "/games" },
  { name: "Track Order", href: "/track-order" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    async function checkCustomer() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });
        const data = await response.json();

        if (active) {
          setLoggedIn(Boolean(response.ok && data.success));
        }
      } catch {
        if (active) setLoggedIn(false);
      } finally {
        if (active) setCheckingAuth(false);
      }
    }

    checkCustomer();

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setLoggedIn(false);
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      alert("Logout failed. Please try again.");
    }
  }

  function CustomerLink({ mobile = false }: { mobile?: boolean }) {
    const base =
      "block rounded-xl px-4 py-3 text-sm font-semibold transition-colors";

    if (checkingAuth) {
      return (
        <span className="block px-4 py-3 text-sm text-slate-400">
          Checking account...
        </span>
      );
    }

    if (loggedIn) {
      return (
        <Link
          href="/account"
          onClick={() => setMenuOpen(false)}
          className={`${base} ${
            pathname.startsWith("/account")
              ? "bg-cyan-400 text-slate-950"
              : mobile
                ? "bg-white/5 text-cyan-300 hover:bg-white/10"
                : "text-cyan-300 hover:bg-white/5"
          }`}
        >
          My Account
        </Link>
      );
    }

    return (
      <Link
        href="/login"
        onClick={() => setMenuOpen(false)}
        className={`${base} ${
          mobile
            ? "bg-cyan-400 text-center text-slate-950 hover:bg-cyan-300"
            : "bg-cyan-400 text-center text-slate-950 hover:bg-cyan-300"
        }`}
      >
        Login / Sign Up
      </Link>
    );
  }

  function NavItems({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        {navLinks.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-cyan-400 text-slate-950"
                  : mobile
                    ? "text-slate-200 hover:bg-white/10 hover:text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}

        <CustomerLink mobile={mobile} />

        {loggedIn && !checkingAuth && (
          <button
            type="button"
            onClick={handleLogout}
            className={`rounded-xl px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white ${
              mobile ? "w-full" : ""
            }`}
          >
            Logout
          </button>
        )}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex min-w-0 items-center gap-3"
          aria-label="TopupCenter homepage"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20 sm:h-11 sm:w-11">
            T
          </span>

          <span className="min-w-0 leading-tight">
            <span className="block truncate text-base font-extrabold tracking-wide text-white sm:text-lg">
              TopupCenter
            </span>
            <span className="mt-1 hidden text-xs text-slate-400 min-[360px]:block">
              Fast · Trusted · Gaming Top-up
            </span>
          </span>
        </Link>

        {/* Desktop and tablet navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          <NavItems />
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:hidden"
        >
          {menuOpen ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Responsive dropdown for phones and tablets */}
      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-white/10 bg-slate-950 px-4 py-4 sm:px-6 lg:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto grid max-w-7xl gap-2 sm:grid-cols-2"
          >
            <NavItems mobile />
          </nav>
        </div>
      )}
    </header>
  );
}