"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Slot } from "@/lib/types";
import { SlotCalendar } from "@/components/slot-calendar";
import { rescheduleAppointmentAction } from "@/lib/appointment-actions";
import type { ActionState } from "@/lib/auth-actions";

export function RescheduleControl({
  id,
  slots,
  onDone,
  note,
}: {
  id: string;
  slots: Slot[];
  onDone?: () => void;
  note?: string;
}) {
  const [slot, setSlot] = useState<Slot | null>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    rescheduleAppointmentAction,
    {},
  );
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => doneRef.current?.(), 900);
      return () => clearTimeout(t);
    }
  }, [state.success]);

  if (state.success) {
    return <p className="chip w-fit">Verplaatst naar het nieuwe moment.</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md border border-line p-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="date" value={slot?.date ?? ""} />
      <input type="hidden" name="time" value={slot?.time ?? ""} />
      {note && <p className="text-[0.8125rem] text-muted">{note}</p>}
      {slots.length === 0 ? (
        <p className="text-[0.9375rem] text-muted">Er zijn geen vrije momenten.</p>
      ) : (
        <SlotCalendar slots={slots} selected={slot} onSelect={setSlot} />
      )}
      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      <button type="submit" className="btn btn-primary w-fit" disabled={!slot || pending}>
        {pending ? "Bezig…" : "Verplaats naar dit moment"}
      </button>
    </form>
  );
}
