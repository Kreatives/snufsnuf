import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getOwnedProvider,
  getProviderHours,
  getProviderExceptions,
  getServicesByProvider,
  getAgendaItems,
} from "@/lib/data";
import { getAvailableSlots } from "@/lib/availability";
import { WeekAgenda } from "@/components/week-agenda";
import { ManualEntryForm } from "@/components/manual-entry-form";

const SHORT = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const { week } = await searchParams;
  const weekOffset = Number(week) || 0;

  const now = new Date();
  const todayISO = now.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  const base = new Date(now);
  base.setHours(12, 0, 0, 0);
  const dow = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - dow + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const iso = dt.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
    return {
      iso,
      short: SHORT[i],
      dayNum: Number(iso.slice(8, 10)),
      isToday: iso === todayISO,
      weekday: new Date(`${iso}T12:00:00Z`).getUTCDay(),
    };
  });

  const rangeStart = new Date(monday);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + 7);

  const [hourRows, exceptionRows, services, items, rescheduleSlots] = await Promise.all([
    getProviderHours(provider.id),
    getProviderExceptions(provider.id),
    getServicesByProvider(provider.id),
    getAgendaItems(provider.id, rangeStart, rangeEnd),
    getAvailableSlots(provider.id, { days: 30 }),
  ]);

  const hours: Record<number, { open: number; close: number }> = {};
  for (const h of hourRows) {
    hours[h.weekday] = { open: toMin(h.open_time), close: toMin(h.close_time) };
  }
  const exceptions: Record<string, string> = {};
  for (const e of exceptionRows) exceptions[e.date] = e.reason;

  const timedItems = items.filter((i) => !i.isMultiDay);
  const allDayItems = items.filter((i) => i.isMultiDay);

  const rangeLabel = `${new Date(days[0].iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  })} – ${new Date(days[6].iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  })}`;

  return (
    <div>
      <h1 className="text-h2 mb-6">Agenda</h1>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/agenda?week=${weekOffset - 1}`}
            className="btn btn-ghost h-9 w-9 px-0"
            aria-label="Vorige week"
          >
            ←
          </Link>
          <Link
            href={`/dashboard/agenda?week=${weekOffset + 1}`}
            className="btn btn-ghost h-9 w-9 px-0"
            aria-label="Volgende week"
          >
            →
          </Link>
          {weekOffset !== 0 && (
            <Link href="/dashboard/agenda" className="btn btn-ghost h-9 px-4">
              Vandaag
            </Link>
          )}
          <p className="text-h3 ml-2">{rangeLabel}</p>
        </div>
        <p className="text-[0.9375rem] text-muted">
          {items.length} {items.length === 1 ? "afspraak" : "afspraken"} deze week ·{" "}
          {services.length} producten
        </p>
      </div>

      <div className="mb-4">
        <ManualEntryForm />
      </div>

      <WeekAgenda
        days={days}
        items={timedItems}
        allDayItems={allDayItems}
        rescheduleSlots={rescheduleSlots}
        hours={hours}
        exceptions={exceptions}
      />

      {items.length === 0 && (
        <p className="text-[0.9375rem] text-muted mt-4">
          Nog geen afspraken deze week. Nieuwe boekingen verschijnen hier automatisch.
        </p>
      )}
    </div>
  );
}
