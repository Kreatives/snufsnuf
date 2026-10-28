import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import {
  getOwnedProvider,
  getServicesByProvider,
  getProviderStats,
  getNextAppointments,
} from "@/lib/data";
import { euro } from "@/lib/pricing";
import type { AppointmentStatus } from "@/lib/types";

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-eyebrow">{label}</p>
      <p className="text-display mt-2">{value}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const [stats, next, services] = await Promise.all([
    getProviderStats(provider.id),
    getNextAppointments(provider.id, 6),
    getServicesByProvider(provider.id),
  ]);

  return (
    <div>
      <div className="mb-8">
        <p className="text-eyebrow">{provider.name}</p>
        <h1 className="text-h2">Overzicht</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Metric label="Aankomende afspraken" value={String(stats.upcoming)} />
        <Metric label="Deze week" value={String(stats.thisWeek)} />
        <Metric label="Boekingen totaal" value={String(stats.total)} />
        <Metric label="Omzet" value={euro(stats.revenueCents)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3">Aankomende afspraken</h2>
            <Link href="/dashboard/agenda" className="text-[0.875rem] text-muted hover:text-ink">
              Naar agenda
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {next.length === 0 && (
              <p className="card p-5 text-muted text-[0.9375rem]">
                Nog geen aankomende afspraken.
              </p>
            )}
            {next.map((a) => (
              <article key={a.id} className="card p-4 flex items-center gap-4">
                <div className="text-center w-20 shrink-0">
                  <p className="text-[0.875rem] font-medium capitalize">{a.dayLabel}</p>
                  <p className="text-[0.8125rem] text-muted">{a.time}</p>
                </div>
                <div className="flex-1 min-w-0 border-l border-line pl-4">
                  <p className="font-medium truncate">
                    {a.animalName}{" "}
                    <span className="text-muted font-normal">· {a.serviceName}</span>
                  </p>
                  <p className="text-[0.8125rem] text-muted truncate">{a.owner}</p>
                </div>
                <span className="chip shrink-0">{STATUS_LABEL[a.status]}</span>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3">Aanbod</h2>
            <Link href="/dashboard/diensten" className="text-[0.875rem] text-muted hover:text-ink">
              Beheren
            </Link>
          </div>
          <div className="card p-5 flex flex-col gap-2 text-[0.9375rem]">
            {services.length === 0 ? (
              <p className="text-muted">Nog geen producten.</p>
            ) : (
              services.map((s) => (
                <div key={s.id} className="flex justify-between">
                  <span className="truncate">{s.name}</span>
                  <span className="text-muted shrink-0">
                    {s.perNight ? "per nacht" : s.perHour ? "per uur" : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
