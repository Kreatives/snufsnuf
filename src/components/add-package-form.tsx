"use client";

import { useActionState } from "react";
import { addPackageAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";

export function AddPackageForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addPackageAction, {});

  return (
    <form action={action} className="card p-6 flex flex-col gap-5">
      <h2 className="text-h3">Nieuw pakket</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="name">
            Naam
          </label>
          <input
            id="name"
            name="name"
            className="field-input"
            placeholder="Bijv. Logeren of Dagopvang"
            required
          />
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
          placeholder="Wat is inbegrepen?"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="day_price">
          Tarief per dag (€)
        </label>
        <input
          id="day_price"
          name="day_price"
          className="field-input w-40"
          inputMode="decimal"
          placeholder="25,00"
          required
        />
      </div>

      <div>
        <span className="field-label">Upsells (optioneel)</span>
        <p className="text-[0.8125rem] text-muted mb-2">
          Extra&apos;s die een baasje erbij kan kiezen, zoals een extra wandeling of vervoer.
        </p>
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-[1fr_8rem] gap-3">
              <input
                name="addon_name"
                className="field-input h-10"
                placeholder="Naam (bijv. Extra wandeling)"
              />
              <input
                name="addon_price"
                className="field-input h-10"
                inputMode="decimal"
                placeholder="Prijs (€)"
              />
            </div>
          ))}
        </div>
      </div>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Pakket toegevoegd.</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Pakket opslaan"}
      </button>
    </form>
  );
}
