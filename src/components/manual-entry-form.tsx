"use client";

import { useActionState, useState } from "react";
import { addManualEntryAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";

export function ManualEntryForm() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"afspraak" | "blokkade">("afspraak");
  const [state, action, pending] = useActionState<ActionState, FormData>(addManualEntryAction, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost">
        + Handmatig toevoegen
      </button>
    );
  }

  return (
    <form action={action} className="card p-5 flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setKind("afspraak")}
            className={`chip ${kind === "afspraak" ? "chip-solid" : "hover:border-ink hover:text-ink"}`}
          >
            Afspraak
          </button>
          <button
            type="button"
            onClick={() => setKind("blokkade")}
            className={`chip ${kind === "blokkade" ? "chip-solid" : "hover:border-ink hover:text-ink"}`}
          >
            Blokkade
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn btn-ghost h-8 w-8 px-0"
          aria-label="Sluiten"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="field-label" htmlFor="date">
            Datum
          </label>
          <input id="date" name="date" type="date" className="field-input h-10" required />
        </div>
        <div>
          <label className="field-label" htmlFor="time">
            Tijd
          </label>
          <input id="time" name="time" type="time" className="field-input h-10" required />
        </div>
        <div>
          <label className="field-label" htmlFor="duration">
            Duur (min)
          </label>
          <input
            id="duration"
            name="duration"
            className="field-input h-10"
            inputMode="numeric"
            defaultValue={60}
          />
        </div>
      </div>

      {kind === "afspraak" ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <input name="title" className="field-input h-10" placeholder="Naam dier" />
          <input name="owner" className="field-input h-10" placeholder="Klantnaam" />
          <input name="service" className="field-input h-10" placeholder="Dienst (bijv. Knipbeurt)" />
        </div>
      ) : (
        <input name="title" className="field-input h-10" placeholder="Reden (bijv. Pauze)" />
      )}

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Toegevoegd aan de agenda.</p>}

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
