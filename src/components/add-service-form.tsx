"use client";

import { useActionState } from "react";
import { addServiceAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";
import { SIZE_LABELS } from "@/lib/pricing";
import type { SizeClass } from "@/lib/types";

const SIZES: SizeClass[] = ["xs", "s", "m", "l", "xl"];

export function AddServiceForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addServiceAction, {});

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <h2 className="text-h3">Nieuwe dienst</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="name">
            Naam
          </label>
          <input id="name" name="name" className="field-input" required />
        </div>
        <div>
          <label className="field-label" htmlFor="species">
            Soort
          </label>
          <select id="species" name="species" className="field-input" defaultValue="hond">
            <option value="hond">Hond</option>
            <option value="kat">Kat</option>
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="description">
          Omschrijving
        </label>
        <textarea
          id="description"
          name="description"
          className="field-input h-20 py-2 resize-none"
          placeholder="Wat houdt de beurt in?"
        />
      </div>

      <div>
        <span className="field-label">Prijs en duur per maat</span>
        <p className="text-[0.8125rem] text-muted mb-2">
          Vul alleen de maten in die je aanbiedt. Prijs in euro, duur in minuten.
        </p>
        <div className="flex flex-col gap-2">
          {SIZES.map((size) => (
            <div key={size} className="grid grid-cols-[3rem_1fr_1fr] items-center gap-3">
              <span className="font-medium text-[0.9375rem]">{SIZE_LABELS[size]}</span>
              <input
                name={`price_${size}`}
                className="field-input h-10"
                inputMode="decimal"
                placeholder="Prijs (€)"
              />
              <input
                name={`dur_${size}`}
                className="field-input h-10"
                inputMode="numeric"
                placeholder="Duur (min)"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="buffer_min">
            Buffer na afspraak (min)
          </label>
          <input
            id="buffer_min"
            name="buffer_min"
            className="field-input"
            inputMode="numeric"
            defaultValue={15}
          />
        </div>
        <label className="flex items-center gap-2 text-[0.9375rem] cursor-pointer self-end pb-3">
          <input type="checkbox" name="indicative" defaultChecked className="size-4 accent-ink" />
          Vanaf-prijs tonen (bij vachtgevoelige beurten)
        </label>
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Dienst toegevoegd.</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Dienst opslaan"}
      </button>
    </form>
  );
}
