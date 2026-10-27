"use client";

import { useActionState, useState } from "react";
import {
  cancelAppointmentAction,
  rescheduleAppointmentAction,
} from "@/lib/appointment-actions";
import type { ActionState } from "@/lib/auth-actions";

export function ConsumerAppointmentActions({
  id,
  dateISO,
  time24,
}: {
  id: string;
  dateISO: string;
  time24: string;
}) {
  const [moving, setMoving] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    rescheduleAppointmentAction,
    {},
  );

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMoving((m) => !m)}
          className="btn btn-ghost h-8 px-3 text-[0.8125rem]"
        >
          Verzetten
        </button>
        <form action={cancelAppointmentAction}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="btn btn-ghost h-8 px-3 text-[0.8125rem]">
            Annuleren
          </button>
        </form>
      </div>

      {moving && (
        <form action={action} className="flex flex-wrap gap-2 items-center rounded-md border border-line p-3">
          <input type="hidden" name="id" value={id} />
          <input name="date" type="date" className="field-input h-10 w-40" defaultValue={dateISO} required />
          <input name="time" type="time" className="field-input h-10 w-28" defaultValue={time24} required />
          <button type="submit" className="btn btn-primary h-10 px-4" disabled={pending}>
            {pending ? "…" : "Opslaan"}
          </button>
          {state.error && <p className="chip chip-alert w-full">{state.error}</p>}
          {state.success && <p className="chip w-fit">Verzet.</p>}
        </form>
      )}
    </div>
  );
}
