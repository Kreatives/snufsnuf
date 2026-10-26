"use client";

import { useActionState } from "react";
import { createProviderAction, type ActionState } from "@/lib/auth-actions";

const CATEGORIES = [
  { value: "trimsalon", label: "Trimsalon" },
  { value: "kattentrimsalon", label: "Kattentrimsalon" },
  { value: "mobiele_trimmer", label: "Mobiele trimmer" },
  { value: "dagopvang", label: "Dagopvang" },
  { value: "pension", label: "Pension" },
  { value: "uitlaatservice", label: "Uitlaatservice" },
];

const SKILLS = [
  { value: "angsthond", label: "Angsthonden" },
  { value: "kat", label: "Katten" },
  { value: "senior", label: "Senioren" },
  { value: "puppy", label: "Puppy's" },
  { value: "handstrippen", label: "Handstrippen" },
];

export function OnboardingForm({ defaultName }: { defaultName?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createProviderAction,
    {},
  );

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="name">
            Handelsnaam
          </label>
          <input id="name" name="name" className="field-input" defaultValue={defaultName} required />
        </div>
        <div>
          <label className="field-label" htmlFor="category">
            Categorie
          </label>
          <select id="category" name="category" className="field-input" defaultValue="trimsalon">
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="city">
            Stad
          </label>
          <input id="city" name="city" className="field-input" required />
        </div>
        <div>
          <label className="field-label" htmlFor="kvk">
            KvK-nummer
          </label>
          <input id="kvk" name="kvk" className="field-input" inputMode="numeric" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="phone">
            Telefoon
          </label>
          <input id="phone" name="phone" className="field-input" inputMode="tel" />
        </div>
        <div>
          <label className="field-label" htmlFor="website">
            Website
          </label>
          <input id="website" name="website" className="field-input" placeholder="https://" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="address">
          Adres
        </label>
        <input id="address" name="address" className="field-input" />
      </div>

      <div>
        <label className="field-label" htmlFor="blurb">
          Profieltekst
        </label>
        <textarea
          id="blurb"
          name="blurb"
          className="field-input h-28 py-2 resize-none"
          minLength={150}
          maxLength={1200}
          placeholder="Vertel baasjes hoe je werkt, met welke dieren je ervaring hebt en wat jouw salon bijzonder maakt. Minimaal 150 tekens."
        />
        <p className="text-[0.8125rem] text-muted mt-1">Tussen 150 en 1.200 tekens.</p>
      </div>

      <div>
        <span className="field-label">Waar heb je ervaring mee?</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {SKILLS.map((s) => (
            <label
              key={s.value}
              className="chip cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-bg has-[:checked]:border-ink"
            >
              <input type="checkbox" name="skills" value={s.value} className="sr-only" />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
          <input type="checkbox" name="prikkelarm" className="size-4 accent-ink" /> Prikkelarme salon
        </label>
        <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
          <input type="checkbox" name="mobiel" className="size-4 accent-ink" /> Kom aan huis
        </label>
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Bezig…" : "Salon publiceren"}
      </button>
    </form>
  );
}
