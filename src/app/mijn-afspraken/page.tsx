import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMyAppointments, type MyAppointment } from "@/lib/data";
import { euro, formatDuration } from "@/lib/pricing";
import { getAvailableSlots } from "@/lib/availability";
import { ConsumerAppointmentActions } from "@/components/appointment-actions-consumer";
import type { AppointmentStatus, Slot } from "@/lib/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  aanvraag: "Aanvraag",
  bevestigd: "Bevestigd",
  verwacht: "Verwacht",
  aanwezig: "Aanwezig",
  in_behandeling: "In behandeling",
  klaar: "Klaar",
  opgehaald: "Opgehaald",
  no_show: "No-show",
  geannuleerd: "Geannuleerd",
};

function Card({ a, slots }: { a: MyAppointment; slots: Slot[] }) {
  const canManage = !a.isPast && a.status !== "geannuleerd";
  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{a.serviceName}</p>
          <p className="text-[0.875rem] text-muted mt-0.5 capitalize">
            {a.dayLabel} · {a.time}
            {!a.isStay && a.durationMin > 0 ? ` · ${formatDuration(a.durationMin)}` : ""}
          </p>
          <p className="text-[0.875rem] text-muted mt-0.5">
            {a.animalName} ·{" "}
            <Link
              href={`/aanbieder/${a.providerSlug}`}
              className="underline underline-offset-2 hover:text-ink"
            >
              {a.providerName}
            </Link>
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="chip">{STATUS_LABEL[a.status]}</span>
          <p className="text-[0.9375rem] font-medium mt-2">{euro(a.priceCents)}</p>
        </div>
      </div>

      {a.providerMoved && !a.isPast && (
        <p className="chip chip-alert w-fit mt-3">Let op: deze afspraak is verplaatst door de salon</p>
      )}

      {canManage && <ConsumerAppointmentActions id={a.id} slots={slots} />}
    </article>
  );
}

export default async function MijnAfsprakenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role === "aanbieder") redirect("/dashboard");

  const all = await getMyAppointments();
  const upcoming = all.filter((a) => !a.isPast).reverse();
  const past = all.filter((a) => a.isPast);

  // Vrije momenten per aanbieder ophalen, voor het verzetten.
  const providerIds = [...new Set(upcoming.map((a) => a.providerId))];
  const slotLists = await Promise.all(
    providerIds.map((pid) => getAvailableSlots(pid, { days: 30 })),
  );
  const slotsByProvider: Record<string, Slot[]> = {};
  providerIds.forEach((pid, i) => (slotsByProvider[pid] = slotLists[i]));

  return (
    <main className="mx-auto max-w-[760px] px-6 py-14">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <h1 className="text-h2">Mijn afspraken</h1>
        <div className="flex gap-2">
          <Link href="/mijn-dieren" className="chip hover:border-ink hover:text-ink">
            Mijn dieren
          </Link>
          <span className="chip chip-solid">Afspraken</span>
        </div>
      </div>

      {all.length === 0 && (
        <p className="text-muted text-[0.9375rem]">
          Je hebt nog geen afspraken. Zoek een aanbieder en boek je eerste beurt.
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-h3 mb-3">Komend</h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <Card key={a.id} a={a} slots={slotsByProvider[a.providerId] ?? []} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-h3 mb-3">Geweest</h2>
          <div className="flex flex-col gap-3 opacity-80">
            {past.map((a) => (
              <Card key={a.id} a={a} slots={[]} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
