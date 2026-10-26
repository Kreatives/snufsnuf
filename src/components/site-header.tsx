import Link from "next/link";

export function SiteHeader() {
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
          <Link
            href="/dashboard"
            className="text-muted hover:text-ink transition-colors"
          >
            Voor aanbieders
          </Link>
          <Link href="/dashboard" className="btn btn-ghost h-9 px-4">
            Inloggen
          </Link>
        </nav>
      </div>
    </header>
  );
}
