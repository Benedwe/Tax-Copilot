"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-paper-line bg-paper/95 backdrop-blur sticky top-0 z-20">
      <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-lg tracking-tight text-ink">
          Tax Copilot
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/calculator" className="text-ink-soft hover:text-ink transition-colors">
            Calculator
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="text-ink-soft hover:text-ink transition-colors">
                Dashboard
              </Link>
              <button onClick={logout} className="text-ink-soft hover:text-rust transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-ink-soft hover:text-ink transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink-soft transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
