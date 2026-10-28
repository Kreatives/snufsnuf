"use client";

import { useState } from "react";
import type { Slot } from "@/lib/types";
import { cancelAppointmentAction } from "@/lib/appointment-actions";
import { RescheduleControl } from "@/components/reschedule-control";

export function ConsumerAppointmentActions({ id, slots }: { id: string; slots: Slot[] }) {
  const [moving, setMoving] = useState(false);

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

      {moving && <RescheduleControl id={id} slots={slots} onDone={() => setMoving(false)} />}
    </div>
  );
}
