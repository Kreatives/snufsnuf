"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";
import type { CurrentUser } from "@/lib/session";

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();
  // Op het dashboard is er een eigen zijbalk, dus geen globale header.
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <header className="border-b border-line bg-white/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Snuf Snuf">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/horizontal-green.svg" alt="Snuf Snuf" className="h-7 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 text-[0.9375rem]">
          <Link href="/zoeken" className="text-muted hover:text-ink transition-colors">
            Zoeken
          </Link>
          {user ? (
            <>
              {user.role === "aanbieder" ? (
                <Link href="/dashboard" className="text-muted hover:text-ink transition-colors">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/mijn-dieren" className="text-muted hover:text-ink transition-colors">
                    Mijn dieren
                  </Link>
                  <Link
                    href="/mijn-afspraken"
                    className="text-muted hover:text-ink transition-colors"
                  >
                    Afspraken
                  </Link>
                  <Link href="/mijn-account" className="text-muted hover:text-ink transition-colors">
                    Account
                  </Link>
                </>
              )}
              <form action={logoutAction}>
                <button type="submit" className="btn btn-ghost h-9 px-4">
                  Uitloggen
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/registreren"
                className="text-muted hover:text-ink transition-colors"
              >
                Registreren
              </Link>
              <Link href="/inloggen" className="btn btn-ghost h-9 px-4">
                Inloggen
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
