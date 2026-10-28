"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction, } from "@/lib/auth-actions";
import { setActiveSalonAction } from "@/lib/provider-actions";

const MENU = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/diensten", label: "Aanbod" },
  { href: "/dashboard/openingstijden", label: "Openingstijden" },
  { href: "/dashboard/salon", label: "Mijn salon" },
  { href: "/dashboard/instellingen", label: "Instellingen" },
];

export function DashboardSidebar({
  salons,
  activeId,
  activeName,
  userEmail,
}: {
  salons: { id: string; name: string }[];
  activeId: string;
  activeName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface min-h-screen sticky top-0 flex flex-col">
      {/* Salon-switcher */}
      <div className="p-3 border-b border-line relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-2.5 rounded-md border border-line p-2 text-left hover:border-ink transition-colors"
        >
          <span className="media-ph size-8 rounded-md shrink-0" aria-hidden />
          <span className="flex-1 min-w-0">
            <span className="block text-[0.875rem] font-medium truncate">{activeName}</span>
            <span className="block text-[0.75rem] text-muted truncate">{userEmail}</span>
          </span>
          <span className="text-muted text-[0.75rem]" aria-hidden>
            ⌄
          </span>
        </button>

        {open && (
          <div className="absolute left-3 right-3 mt-1 z-20 card p-1 flex flex-col gap-0.5">
            {salons.map((s) => (
              <form key={s.id} action={setActiveSalonAction}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  className={`w-full text-left rounded-md px-2.5 py-2 text-[0.875rem] transition-colors ${
                    s.id === activeId ? "bg-bg font-medium" : "hover:bg-bg"
                  }`}
                >
                  {s.name}
                </button>
              </form>
            ))}
            <Link
              href="/dashboard/onboarding"
              className="rounded-md px-2.5 py-2 text-[0.875rem] text-muted hover:bg-bg hover:text-ink transition-colors border-t border-line mt-0.5 pt-2"
            >
              + Salon toevoegen
            </Link>
          </div>
        )}
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
      <div className="p-3 border-t border-line">
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
