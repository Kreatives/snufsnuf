"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Animal, Provider, Service, Slot, SizeClass, CoatType } from "@/lib/types";
import { BREED_LIBRARY } from "@/lib/breeds";
import { createBooking, createStayBooking } from "@/lib/actions";
import { calculateQuote, type QuoteSelection } from "@/lib/quote";
import { euro, formatDuration, SIZE_LABELS, COAT_LABELS } from "@/lib/pricing";
import { SlotCalendar } from "@/components/slot-calendar";
import { DAY_TIMES, nightsBetween } from "@/lib/stay";

const HOLD_SECONDS = 10 * 60;
type Species = "hond" | "kat";

interface Props {
  provider: Provider;
  service: Service;
  slots: Slot[];
  savedAnimals: Animal[];
  preselect?: { date: string; time: string } | null;
  defaultContact?: { email: string; phone: string; name: string };
}

function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingFlow({
  provider,
  service,
  slots,
  savedAnimals,
  preselect,
  defaultContact,
}: Props) {
  const hasOptions = service.variants.length > 0 || service.addons.length > 0;
  const momentLabel = service.perNight ? "Verblijf" : service.perHour ? "Oppas" : "Moment";
  const steps = useMemo(
    () => ["Dier", ...(hasOptions ? ["Opties"] : []), momentLabel, "Intake", "Betalen"],
    [hasOptions, momentLabel],
  );

  const [step, setStep] = useState(0);
  const [animalId, setAnimalId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    species: service.species as Species,
    breed: "",
    sizeClass: "m" as SizeClass,
    coatType: "glad" as CoatType,
    behavior: "sociaal",
    biteRisk: 0 as 0 | 1 | 2 | 3,
  });
  const [variantId, setVariantId] = useState<string | null>(service.variants[0]?.id ?? null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [slot, setSlot] = useState<Slot | null>(
    () => slots.find((s) => s.date === preselect?.date && s.time === preselect?.time) ?? null,
  );
  const [startDate, setStartDate] = useState(isoPlus(1));
  const [endDate, setEndDate] = useState(isoPlus(1 + Math.max(1, service.minNights)));
  const [dropoff, setDropoff] = useState("09:00");
  const [pickup, setPickup] = useState("17:00");
  const [intake, setIntake] = useState({
    email: defaultContact?.email ?? "",
    phone: defaultContact?.phone ?? "",
    lastGroom: "",
    agree: false,
  });
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
        species: draft.species,
        sizeClass: draft.sizeClass,
        coatType: draft.coatType,
        breed: draft.breed || null,
        weightKg: undefined as number | undefined,
        biteRisk: draft.biteRisk as number,
        muzzle: draft.biteRisk >= 2,
        behavior: [draft.behavior],
      };
    }
    const a = savedAnimals.find((x) => x.id === animalId);
    if (!a) return null;
    return {
      name: a.name,
      species: a.species,
      sizeClass: a.sizeClass,
      coatType: a.coatType,
      breed: a.breed,
      weightKg: a.weightKg,
      biteRisk: a.biteRisk as number,
      muzzle: a.muzzleRequired,
      behavior: a.behavior,
    };
  }, [animalId, draft, savedAnimals]);

  const nights = service.perNight ? nightsBetween(startDate, endDate) : 1;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const hoursCount = service.perHour
    ? Math.max(0, (toMin(pickup) - toMin(dropoff)) / 60)
    : 0;

  const selection: QuoteSelection = useMemo(
    () => ({
      variantId,
      addons: Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([addonId, quantity]) => ({ addonId, quantity })),
      nights,
      hours: hoursCount,
    }),
    [variantId, qty, nights, hoursCount],
  );

  const quote = useMemo(
    () =>
      chosen
        ? calculateQuote(
            service,
            { size: chosen.sizeClass, coat: chosen.coatType, weightKg: chosen.weightKg },
            selection,
          )
        : null,
    [chosen, service, selection],
  );

  const current = steps[step];
  const breedKnown = draft.breed !== "" && draft.breed !== "anders";

  function selectBreed(breed: string) {
    const lib = BREED_LIBRARY[breed];
    setDraft((d) => ({ ...d, breed, ...(lib ? { sizeClass: lib.sizeClass, coatType: lib.coatType } : {}) }));
  }

  function toggleAddon(id: string, isPerUnit: boolean, on: boolean) {
    setQty((q) => ({ ...q, [id]: on ? (isPerUnit ? Math.max(1, q[id] || 1) : 1) : 0 }));
  }

  const canNext =
    current === "Dier"
      ? !!chosen && (animalId !== "new" || draft.name.trim() !== "")
      : current === "Verblijf"
        ? nights > 0
        : current === "Oppas"
          ? hoursCount > 0
          : current === "Moment"
            ? !!slot
            : current === "Intake"
            ? intake.email.trim() !== "" && intake.phone.trim() !== "" && intake.agree
            : true;

  async function confirm() {
    if (!quote || !chosen) return;
    setBusy(true);
    setError(null);
    const res = service.perNight
      ? await createStayBooking({
          providerId: provider.id,
          serviceId: service.id,
          serviceName: service.name,
          startDate,
          endDate,
          dropoff,
          pickup,
          nights,
          priceCents: quote.totalCents,
          addons: service.addons.filter((a) => (qty[a.id] || 0) > 0).map((a) => a.name),
          idempotencyKey: idemKey,
          owner: defaultContact?.name || (intake.email ? intake.email.split("@")[0] : "Nieuwe klant"),
          animal: {
            name: chosen.name,
            species: chosen.species,
            behavior: chosen.behavior,
            biteRisk: chosen.biteRisk,
            muzzleRequired: chosen.muzzle,
          },
          intake: { email: intake.email, phone: intake.phone },
        })
      : await createBooking({
          providerId: provider.id,
          serviceId: service.id,
          serviceName: service.name,
          staff: service.perHour ? "" : slot?.staff ?? "",
          date: service.perHour ? startDate : slot!.date,
          time: service.perHour ? dropoff : slot!.time,
          durationMin: quote.durationMin,
          priceCents: quote.totalCents,
          isRequest: false,
          idempotencyKey: idemKey,
          owner: defaultContact?.name || (intake.email ? intake.email.split("@")[0] : "Nieuwe klant"),
          animal: {
            name: chosen.name,
            breed: chosen.breed,
            sizeClass: chosen.sizeClass,
            coatType: chosen.coatType,
            biteRisk: chosen.biteRisk,
            muzzleRequired: chosen.muzzle,
            behavior: chosen.behavior,
          },
          intake: { email: intake.email, phone: intake.phone, lastGroom: intake.lastGroom },
        });
    if (res.ok && res.id) {
      setDoneId(res.id);
      setStep(steps.length); // voorbij de laatste stap = bevestiging
    } else {
      setError(res.error ?? "Er ging iets mis bij het boeken.");
      setBusy(false);
    }
  }

  if (doneId && chosen && quote) {
    return (
      <Confirmation
        provider={provider}
        service={service}
        amountCents={quote.totalCents}
        animalName={chosen.name}
        when={
          service.perNight
            ? `${fmtDate(startDate)} ${dropoff} — ${fmtDate(endDate)} ${pickup}`
            : slot
              ? `${fmtDate(slot.date)}, ${slot.time}`
              : ""
        }
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        <Stepper steps={steps} step={step} />

        {current === "Dier" && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Voor welk dier?</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Je slaat een dier één keer op en hergebruikt het daarna.
            </p>
            <div className="flex flex-col gap-3">
              {savedAnimals.map((a) => (
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
                      <span className="text-[0.875rem] text-muted">
                        {a.breed ?? "onbekend ras"} · maat {SIZE_LABELS[a.sizeClass]} ·{" "}
                        {COAT_LABELS[a.coatType]}
                      </span>
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
                <div>
                  <label className="field-label" htmlFor="ras">
                    Ras
                  </label>
                  <select
                    id="ras"
                    className="field-input"
                    value={draft.breed}
                    onChange={(e) => selectBreed(e.target.value)}
                  >
                    <option value="">Kies een ras</option>
                    {Object.keys(BREED_LIBRARY).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="anders">Weet ik niet / kruising</option>
                  </select>
                </div>
                {breedKnown && (
                  <p className="text-[0.875rem] text-muted">
                    We vulden maat {SIZE_LABELS[draft.sizeClass]} en {COAT_LABELS[draft.coatType]}{" "}
                    automatisch in.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="maat">
                      Maat
                    </label>
                    <select
                      id="maat"
                      className="field-input"
                      value={draft.sizeClass}
                      onChange={(e) => setDraft((d) => ({ ...d, sizeClass: e.target.value as SizeClass }))}
                    >
                      {(Object.keys(SIZE_LABELS) as SizeClass[]).map((s) => (
                        <option key={s} value={s}>
                          {SIZE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="vacht">
                      Vacht
                    </label>
                    <select
                      id="vacht"
                      className="field-input"
                      value={draft.coatType}
                      onChange={(e) => setDraft((d) => ({ ...d, coatType: e.target.value as CoatType }))}
                    >
                      {(Object.keys(COAT_LABELS) as CoatType[]).map((c) => (
                        <option key={c} value={c}>
                          {COAT_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, biteRisk: Number(e.target.value) as 0 | 1 | 2 | 3 }))
                      }
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

        {current === "Opties" && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Opties</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Kies een variant en eventuele extra&apos;s.
            </p>

            {service.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-h3 mb-3">Variant</h3>
                <div className="flex flex-col gap-2">
                  {service.variants.map((v) => (
                    <label
                      key={v.id}
                      className={`card p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        variantId === v.id ? "border-ink" : "hover:border-line-strong"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="variant"
                          className="size-4 accent-ink"
                          checked={variantId === v.id}
                          onChange={() => setVariantId(v.id)}
                        />
                        <span className="font-medium text-[0.9375rem]">{v.name}</span>
                      </span>
                      <span className="text-[0.9375rem] text-muted">
                        {euro(v.priceCents)} · {formatDuration(v.durationMin)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {service.addons.length > 0 && (
              <div>
                <h3 className="text-h3 mb-3">Extra&apos;s</h3>
                <div className="flex flex-col gap-2">
                  {service.addons.map((a) => {
                    const on = (qty[a.id] || 0) > 0;
                    return (
                      <div
                        key={a.id}
                        className={`card p-4 flex items-center justify-between gap-3 transition-colors ${
                          on ? "border-ink" : ""
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="size-4 accent-ink"
                            checked={on}
                            onChange={(e) => toggleAddon(a.id, a.isPerUnit, e.target.checked)}
                          />
                          <span className="font-medium text-[0.9375rem]">{a.name}</span>
                        </label>
                        <span className="flex items-center gap-3">
                          {a.isPerUnit && on && (
                            <input
                              type="number"
                              min={1}
                              className="field-input h-9 w-20"
                              value={qty[a.id] || 1}
                              onChange={(e) =>
                                setQty((q) => ({ ...q, [a.id]: Math.max(1, Number(e.target.value)) }))
                              }
                            />
                          )}
                          <span className="text-[0.9375rem] text-muted">
                            {euro(a.priceCents)}
                            {a.isPerUnit && a.unitLabel ? ` / ${a.unitLabel}` : ""}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {current === "Moment" && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Kies een moment</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Live beschikbaarheid. Zodra je kiest houden we het slot tien minuten voor je vast.
            </p>
            <SlotCalendar slots={slots} selected={slot} onSelect={setSlot} />
          </section>
        )}

        {current === "Oppas" && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Afhalen en ophalen</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Kies de dag en het afhaal- en ophaalmoment. Je betaalt per uur.
            </p>
            <div className="card p-5 flex flex-col gap-4">
              <div>
                <label className="field-label" htmlFor="oppasdag">
                  Dag
                </label>
                <input
                  id="oppasdag"
                  type="date"
                  className="field-input"
                  min={isoPlus(1)}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="afhaal">
                    Afhaaltijd
                  </label>
                  <select
                    id="afhaal"
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
                  <label className="field-label" htmlFor="ophaal2">
                    Ophaaltijd
                  </label>
                  <select
                    id="ophaal2"
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
              {hoursCount <= 0 && (
                <p className="chip chip-alert w-fit">Ophalen moet na afhalen liggen.</p>
              )}
              {hoursCount > 0 && (
                <p className="text-[0.875rem] text-muted">
                  {hoursCount} uur oppas.
                </p>
              )}
            </div>
          </section>
        )}

        {current === "Verblijf" && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Kies de periode</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Aankomst en vertrek, plus de breng- en ophaaltijd.
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
              {service.minNights > 1 && (
                <p className="text-[0.8125rem] text-muted">Minimaal {service.minNights} nachten.</p>
              )}
            </div>
          </section>
        )}

        {current === "Intake" && (
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
                    className={`field-input ${
                      !!defaultContact?.email && intake.email === defaultContact.email
                        ? "text-muted"
                        : ""
                    }`}
                    value={intake.email}
                    onChange={(e) => setIntake((i) => ({ ...i, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="tel">
                    Telefoon
                  </label>
                  <input
                    id="tel"
                    className={`field-input ${
                      !!defaultContact?.phone && intake.phone === defaultContact.phone
                        ? "text-muted"
                        : ""
                    }`}
                    value={intake.phone}
                    onChange={(e) => setIntake((i) => ({ ...i, phone: e.target.value }))}
                  />
                </div>
              </div>
              {(defaultContact?.email || defaultContact?.phone) && (
                <p className="text-[0.8125rem] text-muted">
                  Automatisch ingevuld vanuit je account. Klik in een veld om het aan te passen.
                </p>
              )}
              <label className="flex items-start gap-3 text-[0.9375rem] cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-ink"
                  checked={intake.agree}
                  onChange={(e) => setIntake((i) => ({ ...i, agree: e.target.checked }))}
                />
                <span>
                  Ik ga akkoord met de voorwaarden en het annuleringsbeleid van {provider.name}.
                </span>
              </label>
            </div>
          </section>
        )}

        {current === "Betalen" && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Betalen</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              {quote?.isFromPrice
                ? "Je betaalt een indicatief bedrag. De eindprijs wordt na afloop vastgesteld."
                : "Je rekent nu het volledige bedrag af."}{" "}
              Prototype: er wordt niet echt afgerekend.
            </p>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={busy}
              onClick={confirm}
            >
              {busy ? "Bezig…" : `Betaal ${euro(quote?.totalCents ?? 0)} bij ${provider.name}`}
            </button>
            {error && <p className="chip chip-alert w-fit mt-3">{error}</p>}
          </section>
        )}

        {current !== "Betalen" && (
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
        <SummaryPanel
          provider={provider}
          service={service}
          quote={quote}
          animalName={chosen?.name ?? null}
          muzzle={chosen?.muzzle ?? false}
          when={
            service.perNight
              ? nights > 0
                ? `${fmtDate(startDate)} — ${fmtDate(endDate)} · ${nights} ${nights === 1 ? "nacht" : "nachten"}`
                : null
              : service.perHour
                ? hoursCount > 0
                  ? `${fmtDate(startDate)} · ${dropoff}–${pickup} · ${hoursCount} uur`
                  : null
                : slot
                  ? `${fmtDate(slot.date)}, ${slot.time}`
                  : null
          }
          showHold={!service.perNight && !service.perHour && !!slot}
        />
      </aside>
    </div>
  );
}

function Stepper({ steps, step }: { steps: string[]; step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => (
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
          {i < steps.length - 1 && <span className="h-px flex-1 bg-line-strong" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function SummaryPanel({
  provider,
  service,
  quote,
  animalName,
  muzzle,
  when,
  showHold,
}: {
  provider: Provider;
  service: Service;
  quote: ReturnType<typeof calculateQuote> | null;
  animalName: string | null;
  muzzle: boolean;
  when: string | null;
  showHold: boolean;
}) {
  return (
    <div className="card p-5 lg:sticky lg:top-24 flex flex-col gap-4">
      <div>
        <p className="text-eyebrow">{provider.name}</p>
        <p className="text-h3">{service.name}</p>
      </div>

      {animalName && <Row label="Dier" value={animalName} />}
      {when && <Row label={service.perNight ? "Periode" : "Moment"} value={when} />}

      {quote && (
        <>
          <div className="border-t border-line pt-4">
            <p className="text-eyebrow mb-2">Prijsopbouw</p>
            {quote.breakdown.map((b, i) => (
              <div key={i} className="flex justify-between text-[0.9375rem] py-0.5">
                <span className="text-muted">{b.label}</span>
                <span>
                  {b.deltaPriceCents >= 0 && i > 0 ? "+ " : ""}
                  {euro(b.deltaPriceCents)}
                  {b.deltaDurationMin > 0 && <span className="text-muted"> · {b.deltaDurationMin}m</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-end border-t border-line pt-4">
            <div>
              <p className="text-eyebrow">{quote.isFromPrice ? "Vanaf" : "Totaal"}</p>
              <p className="text-h2">{euro(quote.totalCents)}</p>
            </div>
            {quote.durationMin > 0 && (
              <p className="text-[0.875rem] text-muted">{formatDuration(quote.durationMin)}</p>
            )}
          </div>
          {quote.isFromPrice && (
            <p className="text-[0.8125rem] text-muted">
              Dit is een vanaf-prijs. Bij een dikke of geklitte vacht kan de beurt langer duren en
              iets meer kosten. De trimmer bevestigt het eindbedrag.
            </p>
          )}
        </>
      )}

      {muzzle && <p className="chip chip-alert w-fit">Muilkorf verplicht voor deze afspraak</p>}
      {showHold && <HoldTimer />}
    </div>
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

function HoldTimer() {
  const [left, setLeft] = useState(HOLD_SECONDS);
  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="border-t border-line pt-4 flex items-center justify-between text-[0.875rem]">
      <span className="text-muted">Slot vastgehouden</span>
      <span className="font-medium tabular-nums">{left > 0 ? `${mm}:${ss}` : "verlopen"}</span>
    </div>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function Confirmation({
  provider,
  service,
  amountCents,
  animalName,
  when,
}: {
  provider: Provider;
  service: Service;
  amountCents: number;
  animalName: string;
  when: string;
}) {
  return (
    <section className="max-w-[560px] mx-auto text-center">
      <span className="media-ph size-14 rounded-full mx-auto grid place-items-center" aria-hidden>
        <span className="text-ink text-2xl">✓</span>
      </span>
      <h2 className="text-h2 mt-5">Je boeking staat</h2>
      <p className="text-muted mt-2">
        {provider.name} heeft de boeking ontvangen. Je krijgt een bevestiging per mail.
      </p>
      <div className="card p-5 mt-6 text-left flex flex-col gap-3">
        <Row label="Dienst" value={service.name} />
        <Row label="Dier" value={animalName} />
        <Row label={service.perNight ? "Periode" : "Wanneer"} value={when} />
        <Row label="Betaald" value={euro(amountCents)} />
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
