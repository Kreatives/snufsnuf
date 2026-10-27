"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Animal, Provider, Service } from "@/lib/types";
import { createStayBooking } from "@/lib/actions";
import { euro } from "@/lib/pricing";
import { DAY_TIMES, nightsBetween } from "@/lib/stay";

const STEPS = ["Dier", "Verblijf", "Intake", "Betalen"] as const;

function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function StayBookingFlow({
  provider,
  service,
  savedAnimals,
}: {
  provider: Provider;
  service: Service;
  savedAnimals: Animal[];
}) {
  const [step, setStep] = useState(0);
  const [animalId, setAnimalId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState({ name: "", behavior: "sociaal", biteRisk: 0 });
  const [startDate, setStartDate] = useState(isoPlus(1));
  const [endDate, setEndDate] = useState(isoPlus(3));
  const [dropoff, setDropoff] = useState("09:00");
  const [pickup, setPickup] = useState("17:00");
  const [picked, setPicked] = useState<boolean[]>(service.addons.map(() => false));
  const [intake, setIntake] = useState({ email: "", phone: "", agree: false });
  const [idemKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `idem-${Date.now()}`,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const chosen = useMemo(() => {
    if (animalId === "new") {
      return {
        name: draft.name || "Nieuw dier",
        species: service.species,
        behavior: [draft.behavior],
        biteRisk: draft.biteRisk,
        muzzle: draft.biteRisk >= 2,
      };
    }
    const a = savedAnimals.find((x) => x.id === animalId);
    if (!a) return null;
    return {
      name: a.name,
      species: a.species,
      behavior: a.behavior,
      biteRisk: a.biteRisk,
      muzzle: a.muzzleRequired,
    };
  }, [animalId, draft, savedAnimals, service.species]);

  const nights = nightsBetween(startDate, endDate);
  const dayPrice = service.dayPriceCents ?? 0;
  const addonsTotal = service.addons.reduce(
    (sum, a, i) => (picked[i] ? sum + a.priceCents : sum),
    0,
  );
  const total = nights * dayPrice + addonsTotal;

  const canNext =
    step === 0
      ? !!chosen && (animalId !== "new" || draft.name.trim() !== "")
      : step === 1
        ? nights > 0
        : step === 2
          ? intake.email.trim() !== "" && intake.phone.trim() !== "" && intake.agree
          : true;

  async function confirm() {
    if (!chosen || nights <= 0) return;
    setBusy(true);
    setError(null);
    const res = await createStayBooking({
      providerId: provider.id,
      serviceId: service.id,
      serviceName: service.name,
      startDate,
      endDate,
      dropoff,
      pickup,
      nights,
      priceCents: total,
      addons: service.addons.filter((_, i) => picked[i]).map((a) => a.name),
      idempotencyKey: idemKey,
      owner: intake.email ? intake.email.split("@")[0] : "Nieuwe klant",
      animal: {
        name: chosen.name,
        species: chosen.species,
        behavior: chosen.behavior,
        biteRisk: chosen.biteRisk,
        muzzleRequired: chosen.muzzle,
      },
      intake: { email: intake.email, phone: intake.phone },
    });
    if (res.ok && res.id) {
      setDoneId(res.id);
      setStep(4);
    } else {
      setError(res.error ?? "Er ging iets mis bij het boeken.");
      setBusy(false);
    }
  }

  if (step === 4 && doneId) {
    return (
      <section className="max-w-[560px] mx-auto text-center">
        <span className="media-ph size-14 rounded-full mx-auto grid place-items-center" aria-hidden>
          <span className="text-ink text-2xl">✓</span>
        </span>
        <h2 className="text-h2 mt-5">Het verblijf staat</h2>
        <p className="text-muted mt-2">
          {provider.name} heeft de reservering ontvangen. Je krijgt een bevestiging per mail.
        </p>
        <div className="card p-5 mt-6 text-left flex flex-col gap-3">
          <Row label="Pakket" value={service.name} />
          <Row label="Dier" value={chosen?.name ?? ""} />
          <Row
            label="Van"
            value={`${fmt(startDate)} om ${dropoff}`}
          />
          <Row label="Tot" value={`${fmt(endDate)} om ${pickup}`} />
          <Row label="Nachten" value={String(nights)} />
          <Row label="Betaald" value={euro(total)} />
        </div>
        <div className="flex gap-3 mt-6 justify-center">
          <Link href={`/aanbieder/${provider.slug}`} className="btn btn-ghost">
            Terug
          </Link>
          <Link href="/" className="btn btn-primary">
            Klaar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        <Stepper step={step} />

        {step === 0 && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Voor welk dier?</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Kies een opgeslagen dier of voeg er een toe.
            </p>
            <div className="flex flex-col gap-3">
              {savedAnimals
                .filter((a) => a.species === service.species)
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAnimalId(a.id)}
                    className={`card p-4 text-left flex items-center gap-4 transition-colors ${
                      animalId === a.id ? "border-ink" : "hover:border-line-strong"
                    }`}
                  >
                    <span className="media-ph size-12 rounded-full shrink-0" aria-hidden />
                    <span className="flex-1">
                      <span className="font-medium block">{a.name}</span>
                      <span className="text-[0.875rem] text-muted">{a.breed ?? "onbekend ras"}</span>
                    </span>
                  </button>
                ))}
              <button
                type="button"
                onClick={() => setAnimalId("new")}
                className={`card p-4 text-left transition-colors ${
                  animalId === "new" ? "border-ink" : "hover:border-line-strong"
                }`}
              >
                <span className="font-medium">+ Nieuw dier toevoegen</span>
              </button>
            </div>

            {animalId === "new" && (
              <div className="card p-5 mt-4 flex flex-col gap-4">
                <div>
                  <label className="field-label" htmlFor="naam">
                    Naam
                  </label>
                  <input
                    id="naam"
                    className="field-input"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="gedrag">
                      Gedrag
                    </label>
                    <select
                      id="gedrag"
                      className="field-input"
                      value={draft.behavior}
                      onChange={(e) => setDraft((d) => ({ ...d, behavior: e.target.value }))}
                    >
                      <option value="sociaal">Sociaal</option>
                      <option value="onzeker">Onzeker</option>
                      <option value="angstig">Angstig</option>
                      <option value="reactief">Reactief</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="bijt">
                      Bijtrisico
                    </label>
                    <select
                      id="bijt"
                      className="field-input"
                      value={draft.biteRisk}
                      onChange={(e) => setDraft((d) => ({ ...d, biteRisk: Number(e.target.value) }))}
                    >
                      <option value={0}>Geen</option>
                      <option value={1}>Laag</option>
                      <option value={2}>Matig</option>
                      <option value={3}>Hoog</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Kies de periode</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Selecteer aankomst en vertrek, en de breng- en ophaaltijd.
            </p>
            <div className="card p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="start">
                    Aankomst
                  </label>
                  <input
                    id="start"
                    type="date"
                    className="field-input"
                    min={isoPlus(1)}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="eind">
                    Vertrek
                  </label>
                  <input
                    id="eind"
                    type="date"
                    className="field-input"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="breng">
                    Brengtijd
                  </label>
                  <select
                    id="breng"
                    className="field-input"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                  >
                    {DAY_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="ophaal">
                    Ophaaltijd
                  </label>
                  <select
                    id="ophaal"
                    className="field-input"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  >
                    {DAY_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {nights <= 0 && (
                <p className="chip chip-alert w-fit">Vertrek moet na aankomst liggen.</p>
              )}
            </div>

            {service.addons.length > 0 && (
              <div className="mt-6">
                <h3 className="text-h3 mb-3">Extra&apos;s</h3>
                <div className="flex flex-col gap-2">
                  {service.addons.map((a, i) => (
                    <label
                      key={a.name}
                      className={`card p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        picked[i] ? "border-ink" : "hover:border-line-strong"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="size-4 accent-ink"
                          checked={picked[i]}
                          onChange={(e) =>
                            setPicked((p) => p.map((v, j) => (j === i ? e.target.checked : v)))
                          }
                        />
                        <span className="font-medium text-[0.9375rem]">{a.name}</span>
                      </span>
                      <span className="text-[0.9375rem]">{euro(a.priceCents)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Jouw gegevens</h2>
            <p className="text-muted text-[0.9375rem] mb-6">Je kunt boeken zonder account.</p>
            <div className="card p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="field-input"
                    value={intake.email}
                    onChange={(e) => setIntake((v) => ({ ...v, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="tel">
                    Telefoon
                  </label>
                  <input
                    id="tel"
                    className="field-input"
                    value={intake.phone}
                    onChange={(e) => setIntake((v) => ({ ...v, phone: e.target.value }))}
                  />
                </div>
              </div>
              <label className="flex items-start gap-3 text-[0.9375rem] cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-ink"
                  checked={intake.agree}
                  onChange={(e) => setIntake((v) => ({ ...v, agree: e.target.checked }))}
                />
                <span>
                  Ik ga akkoord met de voorwaarden en het annuleringsbeleid van {provider.name}.
                </span>
              </label>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Betalen</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Prototype: er wordt niet echt afgerekend. In de echte versie loopt dit via Stripe.
            </p>
            <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={confirm}>
              {busy ? "Bezig…" : `Reserveer en betaal ${euro(total)}`}
            </button>
            {error && <p className="chip chip-alert w-fit mt-3">{error}</p>}
          </section>
        )}

        {step < 3 && (
          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Terug
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
            >
              Volgende
            </button>
          </div>
        )}
      </div>

      <aside className="lg:col-span-5">
        <div className="card p-5 lg:sticky lg:top-24 flex flex-col gap-4">
          <div>
            <p className="text-eyebrow">{provider.name}</p>
            <p className="text-h3">{service.name}</p>
          </div>
          {chosen && <Row label="Dier" value={chosen.name} />}
          <Row label="Aankomst" value={`${fmt(startDate)} · ${dropoff}`} />
          <Row label="Vertrek" value={`${fmt(endDate)} · ${pickup}`} />

          <div className="border-t border-line pt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-[0.9375rem]">
              <span className="text-muted">
                {euro(dayPrice)} × {nights} {nights === 1 ? "nacht" : "nachten"}
              </span>
              <span>{euro(nights * dayPrice)}</span>
            </div>
            {service.addons.map((a, i) =>
              picked[i] ? (
                <div key={a.name} className="flex justify-between text-[0.9375rem]">
                  <span className="text-muted">{a.name}</span>
                  <span>{euro(a.priceCents)}</span>
                </div>
              ) : null,
            )}
          </div>

          <div className="flex justify-between items-end border-t border-line pt-4">
            <p className="text-eyebrow">Totaal</p>
            <p className="text-h2">{euro(total)}</p>
          </div>

          {chosen?.muzzle && (
            <p className="chip chip-alert w-fit">Muilkorf verplicht voor dit dier</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function fmt(iso: string): string {
  if (!iso) return "";
  return new Date(iso + "T12:00:00Z").toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2 flex-1">
          <span
            className={`flex items-center gap-2 text-[0.875rem] ${
              i === step ? "text-ink font-medium" : "text-muted"
            }`}
          >
            <span
              className={`size-6 rounded-full grid place-items-center text-[0.75rem] border ${
                i < step
                  ? "bg-ink border-ink text-bg"
                  : i === step
                    ? "border-ink"
                    : "border-line-strong"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line-strong" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[0.9375rem]">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
