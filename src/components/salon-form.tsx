"use client";

import { useActionState } from "react";
import { updateSalonAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";
import type { Provider } from "@/lib/types";

const CATEGORIES = [
  { value: "trimsalon", label: "Trimsalon" },
  { value: "kattentrimsalon", label: "Kattentrimsalon" },
  { value: "mobiele_trimmer", label: "Mobiele trimmer" },
  { value: "dagopvang", label: "Dagopvang" },
  { value: "pension", label: "Pension" },
  { value: "uitlaatservice", label: "Uitlaatservice" },
  { value: "oppas", label: "Oppas aan huis" },
];

const SKILLS = [
  { value: "angsthond", label: "Angsthonden" },
  { value: "kat", label: "Katten" },
  { value: "senior", label: "Senioren" },
  { value: "puppy", label: "Puppy's" },
  { value: "handstrippen", label: "Handstrippen" },
];

export function SalonForm({ provider }: { provider: Provider }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateSalonAction, {});

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="name">
            Handelsnaam
          </label>
          <input id="name" name="name" className="field-input" defaultValue={provider.name} required />
        </div>
        <div>
          <label className="field-label" htmlFor="category">
            Categorie
          </label>
          <select id="category" name="category" className="field-input" defaultValue={provider.category}>
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
          <input id="city" name="city" className="field-input" defaultValue={provider.city} required />
        </div>
        <div>
          <label className="field-label" htmlFor="address">
            Adres
          </label>
          <input id="address" name="address" className="field-input" defaultValue={provider.address} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="field-label" htmlFor="kvk">
            KvK
          </label>
          <input id="kvk" name="kvk" className="field-input" defaultValue={provider.kvk} />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Telefoon
          </label>
          <input id="phone" name="phone" className="field-input" defaultValue={provider.phone} />
        </div>
        <div>
          <label className="field-label" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            className="field-input"
            defaultValue={provider.website}
            placeholder="https://"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="blurb">
          Profieltekst
        </label>
        <textarea
          id="blurb"
          name="blurb"
          className="field-input h-28 py-2 resize-none"
          defaultValue={provider.blurb}
          minLength={150}
          maxLength={1200}
        />
      </div>

      <div>
        <span className="field-label">Ervaring</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {SKILLS.map((s) => (
            <label
              key={s.value}
              className="chip cursor-pointer has-[:checked]:bg-ink has-[:checked]:text-bg has-[:checked]:border-ink"
            >
              <input
                type="checkbox"
                name="skills"
                value={s.value}
                className="sr-only"
                defaultChecked={(provider.skills as string[]).includes(s.value)}
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
          <input
            type="checkbox"
            name="prikkelarm"
            className="size-4 accent-ink"
            defaultChecked={provider.prikkelarm}
          />
          Prikkelarme salon
        </label>
        <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer">
          <input
            type="checkbox"
            name="mobiel"
            className="size-4 accent-ink"
            defaultChecked={provider.mobiel}
          />
          Kom aan huis
        </label>
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Opgeslagen.</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Salon opslaan"}
      </button>
    </form>
  );
}
