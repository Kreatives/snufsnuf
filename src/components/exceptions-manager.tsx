"use client";

import { useActionState } from "react";
import { addExceptionAction, removeExceptionAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";

export function ExceptionsManager({
  existing,
}: {
  existing: { id: string; date: string; reason: string }[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addExceptionAction, {});

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-h3">Gesloten dagen</h2>
        <p className="text-[0.8125rem] text-muted mt-1">
          Vakantie, ziekte of een feestdag. Op deze dagen is er niets te boeken.
        </p>
      </div>

      {existing.length > 0 && (
        <div className="flex flex-col gap-2">
          {existing.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 text-[0.9375rem]">
              <span>
                <span className="font-medium">
                  {new Date(e.date + "T12:00:00Z").toLocaleDateString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                {e.reason && <span className="text-muted"> · {e.reason}</span>}
              </span>
              <form action={removeExceptionAction}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="btn btn-ghost h-9 px-4 text-[0.875rem]">
                  Verwijderen
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={action} className="grid sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
        <div>
          <label className="field-label" htmlFor="date">
            Datum
          </label>
          <input id="date" name="date" type="date" className="field-input h-10" required />
        </div>
        <div>
          <label className="field-label" htmlFor="reason">
            Reden (optioneel)
          </label>
          <input id="reason" name="reason" className="field-input h-10" placeholder="Vakantie" />
        </div>
        <button type="submit" className="btn btn-primary h-10" disabled={pending}>
          Toevoegen
        </button>
      </form>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
    </div>
  );
}
