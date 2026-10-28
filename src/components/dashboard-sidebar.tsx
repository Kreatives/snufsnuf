"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";

const MENU = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/diensten", label: "Aanbod" },
  { href: "/dashboard/openingstijden", label: "Openingstijden" },
  { href: "/dashboard/instellingen", label: "Instellingen" },
];

export function DashboardSidebar({
  salonName,
  salonSlug,
  userEmail,
}: {
  salonName: string;
  salonSlug: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface min-h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
      {/* Salon-switcher */}
      <div className="p-3 border-b border-line">
        <button
          type="button"
          className="w-full flex items-center gap-2.5 rounded-md border border-line p-2 text-left hover:border-ink transition-colors"
        >
          <span className="media-ph size-8 rounded-md shrink-0" aria-hidden />
          <span className="flex-1 min-w-0">
            <span className="block text-[0.875rem] font-medium truncate">{salonName}</span>
            <span className="block text-[0.75rem] text-muted truncate">{userEmail}</span>
          </span>
          <span className="text-muted text-[0.75rem]" aria-hidden>
            ⌄
          </span>
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {MENU.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`rounded-md px-3 py-2 text-[0.9375rem] transition-colors ${
              isActive(m.href)
                ? "bg-ink text-bg font-medium"
                : "text-muted hover:text-ink hover:bg-bg"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </nav>

      {/* Onderaan */}
      <div className="p-3 border-t border-line flex flex-col gap-1">
        <Link
          href={`/aanbieder/${salonSlug}`}
          className="rounded-md px-3 py-2 text-[0.875rem] text-muted hover:text-ink hover:bg-bg transition-colors"
        >
          Bekijk salon ↗
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full text-left rounded-md px-3 py-2 text-[0.875rem] text-muted hover:text-ink hover:bg-bg transition-colors"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </aside>
  );
}
