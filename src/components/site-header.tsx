import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/auth-actions";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-line bg-bg/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="media-ph size-8 rounded-lg" aria-hidden />
          <span className="font-semibold text-[1.125rem] tracking-tight">Snufsnuf</span>
        </Link>
        <nav className="flex items-center gap-6 text-[0.9375rem]">
          <Link href="/" className="text-muted hover:text-ink transition-colors">
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
                </>
              )}
              <Link href="/mijn-account" className="text-muted hover:text-ink transition-colors">
                Account
              </Link>
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
