
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
      router.push("/login");
      router.refresh();
    } catch {
      alert("Logout failed. Please try again.");
    }
  }

  function CustomerLink() {
    if (checkingAuth) {
      return (
        <span className="px-3 py-2 text-sm text-slate-400">
          Account...
        </span>
      );
    }

    if (loggedIn) {
      return (
        <Link
          href="/account"
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
            pathname.startsWith("/account")
              ? "bg-cyan-500 text-slate-950"
              : "bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
          }`}
        >
          My Account
        </Link>
      );
    }

    return (
      <Link
        href="/login"
        className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
          pathname === "/login" || pathname === "/signup"
            ? "bg-cyan-500 text-slate-950"
            : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        }`}
      >
        Login / Sign Up
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 font-black text-slate-950 shadow-lg shadow-cyan-500/25">
            T
          </div>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-wide text-white">
              TopupCenter
            </p>
            <p className="text-xs text-slate-400">
              Fast • Trusted • Instant Gaming Topup
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <CustomerLink />

          {loggedIn && !checkingAuth && (
            <button
              onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Logout
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Nav */}
      <div className="border-t border-white/5 md:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
          {navLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-white/5 text-slate-300"
                }`}
              >
                {item.name}
              </Link>
            );
          })}

          <CustomerLink />

          {loggedIn && !checkingAuth && (
            <button
              onClick={handleLogout}
              className="whitespace-nowrap rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-300"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
