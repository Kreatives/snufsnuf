"use client";

import { useActionState } from "react";
import { updateReschedulePolicyAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";

export function ReschedulePolicyForm({
  minHours,
  feeCents,
}: {
  minHours: number;
  feeCents: number;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateReschedulePolicyAction,
    {},
  );

  return (
    <form action={action} className="card p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-h3">Verzetbeleid</h2>
        <p className="text-[0.8125rem] text-muted mt-1">
          Tot hoe lang van tevoren mag een klant kosteloos verzetten, en wat kost het daarbinnen.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="min_hours">
            Kosteloos verzetten tot (uur vooraf)
          </label>
          <input
            id="min_hours"
            name="min_hours"
            className="field-input"
            inputMode="numeric"
            defaultValue={minHours}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="fee">
            Toeslag daarbinnen (€)
          </label>
          <input
            id="fee"
            name="fee"
            className="field-input"
            inputMode="decimal"
            defaultValue={feeCents ? (feeCents / 100).toString() : ""}
            placeholder="0 = niet toegestaan"
          />
        </div>
      </div>
      <p className="text-[0.8125rem] text-muted">
        Laat de toeslag op 0 staan om verzetten binnen die periode helemaal te blokkeren.
      </p>
      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Opgeslagen.</p>}
      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
