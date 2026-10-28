import Link from "next/link";

const TABS = [
  { href: "/dashboard", label: "Agenda" },
  { href: "/dashboard/diensten", label: "Aanbod" },
  { href: "/dashboard/openingstijden", label: "Openingstijden" },
];

export function DashboardNav({ active }: { active: string }) {
  return (
    <nav className="flex gap-2">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`chip ${t.href === active ? "chip-solid" : "hover:border-ink hover:text-ink"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
