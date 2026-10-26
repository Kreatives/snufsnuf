import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getServicesByProvider, getTodayAppointments } from "@/lib/data";
import { fromPrice, euro, SIZE_LABELS, COAT_LABELS } from "@/lib/pricing";
import type { AppointmentStatus } from "@/lib/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  aanvraag: "Aanvraag",
  bevestigd: "Bevestigd",
  verwacht: "Verwacht",
  aanwezig: "Aanwezig",
  in_behandeling: "In behandeling",
  klaar: "Klaar",
  opgehaald: "Opgehaald",
};

const STATUS_SOLID: AppointmentStatus[] = ["aanwezig", "in_behandeling"];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const [diensten, todayAppointments] = await Promise.all([
    getServicesByProvider(provider.id),
    getTodayAppointments(provider.id),
  ]);

  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const alerts = todayAppointments.filter(
    (a) => a.animal.biteRisk >= 2 || a.animal.medicalNote,
  );

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <p className="text-eyebrow">{provider.name} · dashboard</p>
          <h1 className="text-display capitalize">{today}</h1>
        </div>
        <div className="flex gap-2">
          <span className="chip chip-solid">Agenda</span>
          <span className="chip">Diensten</span>
          <span className="chip">Klanten</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          {alerts.length > 0 && (
            <div className="card p-5 mb-6 border-line-strong">
              <p className="text-eyebrow mb-3">Let op vandaag</p>
              <ul className="flex flex-col gap-2">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-[0.9375rem]">
                    <span className="chip chip-alert shrink-0">
                      {a.time} · {a.animal.name}
                    </span>
                    <span className="text-muted">
                      {a.animal.muzzleRequired && "Muilkorf verplicht. "}
                      {a.animal.medicalNote}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="text-h2 mb-4">Daglijst</h2>
          <div className="flex flex-col gap-3">
            {todayAppointments.length === 0 && (
              <p className="card p-5 text-muted text-[0.9375rem]">
                Nog geen afspraken voor vandaag.
              </p>
            )}
            {todayAppointments.map((a) => {
              const solid = STATUS_SOLID.includes(a.status);
              return (
                <article key={a.id} className="card p-5 flex gap-5">
                  <div className="text-center shrink-0 w-16">
                    <p className="text-h3">{a.time}</p>
                    <p className="text-[0.8125rem] text-muted">{a.durationMin} min</p>
                  </div>
                  <div className="flex-1 border-l border-line pl-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {a.animal.name}{" "}
                          <span className="text-muted font-normal">
                            · {a.animal.breed} · maat {SIZE_LABELS[a.animal.sizeClass]} ·{" "}
                            {COAT_LABELS[a.animal.coatType]}
                          </span>
                        </p>
                        <p className="text-[0.875rem] text-muted mt-0.5">
                          {a.serviceName} · {a.owner} · {a.staff}
                        </p>
                      </div>
                      <span className={`chip shrink-0 ${solid ? "chip-solid" : ""}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>

                    {a.animal.topNote && (
                      <p className="text-[0.875rem] mt-3 text-ink">⤷ {a.animal.topNote}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {a.animal.biteRisk >= 2 && (
                        <span className="chip chip-alert">Bijtrisico hoog</span>
                      )}
                      {a.animal.behavior
                        .filter((b) => b !== "sociaal")
                        .map((b) => (
                          <span key={b} className="chip">
                            {b}
                          </span>
                        ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="card p-5">
            <p className="text-eyebrow mb-3">Vandaag</p>
            <div className="flex flex-col gap-2 text-[0.9375rem]">
              <div className="flex justify-between">
                <span className="text-muted">Afspraken</span>
                <span className="font-medium">{todayAppointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Geboekte tijd</span>
                <span className="font-medium">
                  {Math.round(
                    todayAppointments.reduce((s, a) => s + a.durationMin, 0) / 60,
                  )}{" "}
                  uur
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Diensten</span>
                <span className="font-medium">{diensten.length}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-eyebrow">Diensten</p>
              <Link href="/" className="text-[0.8125rem] text-muted hover:text-ink">
                Beheren
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {diensten.length === 0 && (
                <p className="text-[0.9375rem] text-muted">
                  Je hebt nog geen diensten. Die voeg je binnenkort hier toe.
                </p>
              )}
              {diensten.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-[0.9375rem]"
                >
                  <span>{s.name}</span>
                  <span className="text-muted">
                    {s.indicative ? "vanaf " : ""}
                    {euro(fromPrice(s))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
