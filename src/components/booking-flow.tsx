"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Animal, Provider, Service, Slot, SizeClass, CoatType } from "@/lib/types";
import { BREED_LIBRARY } from "@/lib/mock";
import {
  resolvePrice,
  euro,
  formatDuration,
  SIZE_LABELS,
  COAT_LABELS,
} from "@/lib/pricing";

const STEPS = ["Dier", "Moment", "Intake", "Betalen"] as const;

const HOLD_SECONDS = 10 * 60;

interface Props {
  provider: Provider;
  service: Service;
  slots: Slot[];
  savedAnimals: Animal[];
}

type DraftAnimal = {
  name: string;
  species: Species;
  breed: string;
  sizeClass: SizeClass;
  coatType: CoatType;
  behavior: string;
  biteRisk: 0 | 1 | 2 | 3;
};

type Species = "hond" | "kat";

export function BookingFlow({ provider, service, slots, savedAnimals }: Props) {
  const [step, setStep] = useState(0);
  const [animalId, setAnimalId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<DraftAnimal>({
    name: "",
    species: service.species,
    breed: "",
    sizeClass: "m",
    coatType: "glad",
    behavior: "sociaal",
    biteRisk: 0,
  });
  const [slot, setSlot] = useState<Slot | null>(null);
  const [intake, setIntake] = useState({ email: "", phone: "", lastGroom: "", agree: false });
  const [paid, setPaid] = useState(false);

  const chosenAnimal: {
    name: string;
    sizeClass: SizeClass;
    coatType: CoatType;
    breed: string | null;
    biteRisk: number;
    muzzle: boolean;
  } | null = useMemo(() => {
    if (animalId === "new") {
      return {
        name: draft.name || "Nieuw dier",
        sizeClass: draft.sizeClass,
        coatType: draft.coatType,
        breed: draft.breed || null,
        biteRisk: draft.biteRisk,
        muzzle: draft.biteRisk >= 2,
      };
    }
    const a = savedAnimals.find((x) => x.id === animalId);
    if (!a) return null;
    return {
      name: a.name,
      sizeClass: a.sizeClass,
      coatType: a.coatType,
      breed: a.breed,
      biteRisk: a.biteRisk,
      muzzle: a.muzzleRequired,
    };
  }, [animalId, draft, savedAnimals]);

  const price = useMemo(
    () => (chosenAnimal ? resolvePrice(service, chosenAnimal) : null),
    [chosenAnimal, service],
  );

  const breedKnown = draft.breed !== "" && draft.breed !== "anders";

  // vul maat + vacht automatisch bij een bekend ras (L-11)
  function selectBreed(breed: string) {
    const lib = BREED_LIBRARY[breed];
    setDraft((d) => ({
      ...d,
      breed,
      ...(lib ? { sizeClass: lib.sizeClass, coatType: lib.coatType } : {}),
    }));
  }

  const canNext =
    step === 0
      ? !!chosenAnimal && (animalId !== "new" || draft.name.trim() !== "")
      : step === 1
        ? !!slot
        : step === 2
          ? intake.email.trim() !== "" && intake.phone.trim() !== "" && intake.agree
          : true;

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        {step < 4 && <Stepper step={step} />}

        {step === 0 && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Voor welk dier?</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              De prijs en de duur rekenen we uit maat en vacht. Je slaat een dier één keer op
              en hergebruikt het daarna.
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
                      <span className="text-[0.875rem] text-muted">
                        {a.breed ?? "onbekend ras"} · maat {SIZE_LABELS[a.sizeClass]} ·{" "}
                        {COAT_LABELS[a.coatType]}
                      </span>
                    </span>
                    <span
                      className={`size-5 rounded-full border ${
                        animalId === a.id ? "bg-ink border-ink" : "border-line-strong"
                      }`}
                      aria-hidden
                    />
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
                    placeholder="Bijv. Bella"
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

                {breedKnown ? (
                  <p className="text-[0.875rem] text-muted">
                    We vulden maat {SIZE_LABELS[draft.sizeClass]} en{" "}
                    {COAT_LABELS[draft.coatType]} automatisch in op basis van het ras. Pas het
                    gerust aan als dat beter past.
                  </p>
                ) : (
                  <p className="text-[0.875rem] text-muted">
                    Geen ras bekend? Dan vragen we gewoon maat en vacht uit.
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
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, sizeClass: e.target.value as SizeClass }))
                      }
                    >
                      {service.pricing.map((p) => (
                        <option key={p.sizeClass} value={p.sizeClass}>
                          {SIZE_LABELS[p.sizeClass]}
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
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, coatType: e.target.value as CoatType }))
                      }
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
                        setDraft((d) => ({
                          ...d,
                          biteRisk: Number(e.target.value) as 0 | 1 | 2 | 3,
                        }))
                      }
                    >
                      <option value={0}>Geen</option>
                      <option value={1}>Laag</option>
                      <option value={2}>Matig</option>
                      <option value={3}>Hoog</option>
                    </select>
                  </div>
                </div>

                {draft.biteRisk >= 2 && (
                  <p className="chip chip-alert w-fit">
                    Bij dit bijtrisico geldt een muilkorfvereiste
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {step === 1 && (
          <SlotStep slots={slots} slot={slot} onSelect={setSlot} />
        )}

        {step === 2 && (
          <section className="mt-8">
            <h2 className="text-h2 mb-1">Jouw gegevens en intake</h2>
            <p className="text-muted text-[0.9375rem] mb-6">
              Je kunt boeken zonder account. Deze velden zijn verplicht voor deze dienst.
            </p>
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
                    onChange={(e) => setIntake((i) => ({ ...i, email: e.target.value }))}
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
                    onChange={(e) => setIntake((i) => ({ ...i, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="laatst">
                  Wanneer is je dier voor het laatst getrimd?
                </label>
                <input
                  id="laatst"
                  className="field-input"
                  placeholder="Bijv. 8 weken geleden"
                  value={intake.lastGroom}
                  onChange={(e) => setIntake((i) => ({ ...i, lastGroom: e.target.value }))}
                />
              </div>
              <label className="flex items-start gap-3 text-[0.9375rem] cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-ink"
                  checked={intake.agree}
                  onChange={(e) => setIntake((i) => ({ ...i, agree: e.target.checked }))}
                />
                <span>
                  Ik ga akkoord met de voorwaarden en het annuleringsbeleid van {provider.name}.
                  Kosteloos annuleren tot 24 uur vooraf.
                </span>
              </label>
            </div>
          </section>
        )}

        {step === 3 && price && slot && (
          <PayStep
            provider={provider}
            service={service}
            amountCents={price.fromCents}
            paid={paid}
            onPaid={() => {
              setPaid(true);
              setStep(4);
            }}
          />
        )}

        {step === 4 && price && slot && chosenAnimal && (
          <Confirmation
            provider={provider}
            service={service}
            slot={slot}
            animalName={chosenAnimal.name}
            amountCents={price.fromCents}
          />
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

      {step < 4 && (
        <aside className="lg:col-span-5">
          <SummaryPanel
            provider={provider}
            service={service}
            price={price}
            slot={slot}
            animalName={chosenAnimal?.name ?? null}
            muzzle={chosenAnimal?.muzzle ?? false}
          />
        </aside>
      )}
    </div>
  );
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
          {i < STEPS.length - 1 && (
            <span className="h-px flex-1 bg-line-strong" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

function SlotStep({
  slots,
  slot,
  onSelect,
}: {
  slots: Slot[];
  slot: Slot | null;
  onSelect: (s: Slot) => void;
}) {
  const byDate = new Map<string, Slot[]>();
  for (const s of slots) byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);

  return (
    <section className="mt-8">
      <h2 className="text-h2 mb-1">Kies een moment</h2>
      <p className="text-muted text-[0.9375rem] mb-6">
        Live beschikbaarheid. Zodra je kiest houden we het slot tien minuten voor je vast.
      </p>
      <div className="flex flex-col gap-5">
        {[...byDate.entries()].map(([date, daySlots]) => {
          const d = new Date(date);
          return (
            <div key={date}>
              <p className="text-[0.875rem] font-medium mb-2 capitalize">
                {d.toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s) => {
                  const active = slot?.date === s.date && slot?.time === s.time;
                  return (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => onSelect(s)}
                      className={`chip h-10 px-4 ${
                        active ? "chip-solid" : "hover:border-ink hover:text-ink"
                      } transition-colors`}
                    >
                      {s.time}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PayStep({
  provider,
  service,
  amountCents,
  paid,
  onPaid,
}: {
  provider: Provider;
  service: Service;
  amountCents: number;
  paid: boolean;
  onPaid: () => void;
}) {
  const [method, setMethod] = useState("ideal");
  const [busy, setBusy] = useState(false);

  return (
    <section className="mt-8">
      <h2 className="text-h2 mb-1">Betalen</h2>
      <p className="text-muted text-[0.9375rem] mb-6">
        {service.indicative
          ? "Je betaalt nu een aanbetaling. De eindprijs hangt af van de vacht en stellen we vast na de beurt."
          : "Je rekent nu het volledige bedrag af."}
      </p>
      <div className="card p-5 flex flex-col gap-3">
        {[
          { id: "ideal", label: "iDEAL" },
          { id: "card", label: "Creditcard" },
          { id: "applepay", label: "Apple Pay" },
        ].map((m) => (
          <label
            key={m.id}
            className={`flex items-center justify-between p-4 rounded-md border cursor-pointer transition-colors ${
              method === m.id ? "border-ink" : "border-line-strong"
            }`}
          >
            <span className="font-medium text-[0.9375rem]">{m.label}</span>
            <input
              type="radio"
              name="pay"
              className="size-4 accent-ink"
              checked={method === m.id}
              onChange={() => setMethod(m.id)}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary w-full mt-5"
        disabled={busy || paid}
        onClick={() => {
          setBusy(true);
          setTimeout(onPaid, 900);
        }}
      >
        {busy ? "Bezig met afrekenen…" : `Betaal ${euro(amountCents)} bij ${provider.name}`}
      </button>
      <p className="text-[0.8125rem] text-muted mt-3">
        Prototype: er wordt niet echt afgerekend. In de echte versie loopt dit via Stripe
        Connect, dus het geld landt bij de aanbieder.
      </p>
    </section>
  );
}

function SummaryPanel({
  provider,
  service,
  price,
  slot,
  animalName,
  muzzle,
}: {
  provider: Provider;
  service: Service;
  price: ReturnType<typeof resolvePrice>;
  slot: Slot | null;
  animalName: string | null;
  muzzle: boolean;
}) {
  return (
    <div className="card p-5 lg:sticky lg:top-24 flex flex-col gap-4">
      <div>
        <p className="text-eyebrow">{provider.name}</p>
        <p className="text-h3">{service.name}</p>
      </div>

      {animalName && (
        <Row label="Dier" value={animalName} />
      )}
      {slot && (
        <Row
          label="Moment"
          value={`${new Date(slot.date).toLocaleDateString("nl-NL", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}, ${slot.time}`}
        />
      )}

      {price && (
        <>
          <div className="border-t border-line pt-4">
            <p className="text-eyebrow mb-2">Prijsopbouw</p>
            {price.breakdown.map((b) => (
              <div key={b.label} className="flex justify-between text-[0.9375rem] py-0.5">
                <span className="text-muted">{b.label}</span>
                <span>
                  {b.cents > 0 ? `+ ${euro(b.cents)}` : euro(b.cents)}
                  {b.min > 0 && <span className="text-muted"> · {b.min}m</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-end border-t border-line pt-4">
            <div>
              <p className="text-eyebrow">{price.isIndicative ? "Vanaf" : "Totaal"}</p>
              <p className="text-h2">{euro(price.fromCents)}</p>
            </div>
            <p className="text-[0.875rem] text-muted">{formatDuration(price.durationMin)}</p>
          </div>
          {price.isIndicative && (
            <p className="text-[0.8125rem] text-muted">
              Dit is een vanaf-prijs. Bij een dikke of geklitte vacht kan de beurt langer duren
              en iets meer kosten. De trimmer bevestigt het eindbedrag.
            </p>
          )}
        </>
      )}

      {muzzle && (
        <p className="chip chip-alert w-fit">Muilkorf verplicht voor deze afspraak</p>
      )}

      {slot && <HoldTimer />}
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
      <span className="font-medium tabular-nums">
        {left > 0 ? `${mm}:${ss}` : "verlopen"}
      </span>
    </div>
  );
}

function Confirmation({
  provider,
  service,
  slot,
  animalName,
  amountCents,
}: {
  provider: Provider;
  service: Service;
  slot: Slot;
  animalName: string;
  amountCents: number;
}) {
  const d = new Date(slot.date).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <section className="mt-6 max-w-[560px] mx-auto text-center">
      <span className="media-ph size-14 rounded-full mx-auto grid place-items-center" aria-hidden>
        <span className="text-ink text-2xl">✓</span>
      </span>
      <h2 className="text-h2 mt-5">Je afspraak staat</h2>
      <p className="text-muted mt-2">
        We hebben een bevestiging naar je e-mail gestuurd. {provider.name} heeft de boeking
        ontvangen.
      </p>
      <div className="card p-5 mt-6 text-left flex flex-col gap-3">
        <Row label="Dienst" value={service.name} />
        <Row label="Dier" value={animalName} />
        <Row label="Wanneer" value={`${d}, ${slot.time}`} />
        <Row label="Waar" value={`${provider.name}, ${provider.city}`} />
        <Row label="Betaald" value={euro(amountCents)} />
      </div>
      <div className="flex gap-3 mt-6 justify-center">
        <Link href={`/aanbieder/${provider.slug}`} className="btn btn-ghost">
          Terug naar salon
        </Link>
        <Link href="/" className="btn btn-primary">
          Klaar
        </Link>
      </div>
    </section>
  );
}
