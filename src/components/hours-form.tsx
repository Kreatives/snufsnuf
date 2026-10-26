"use client";

import { useActionState } from "react";
import { saveHoursAction } from "@/lib/provider-actions";
import type { ActionState } from "@/lib/auth-actions";

const DAYS = [
  { wd: 1, label: "Maandag" },
  { wd: 2, label: "Dinsdag" },
  { wd: 3, label: "Woensdag" },
  { wd: 4, label: "Donderdag" },
  { wd: 5, label: "Vrijdag" },
  { wd: 6, label: "Zaterdag" },
  { wd: 0, label: "Zondag" },
];

export interface HourRow {
  weekday: number;
  open_time: string;
  close_time: string;
}

export function HoursForm({ existing }: { existing: HourRow[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveHoursAction, {});
  const byDay = new Map(existing.map((h) => [h.weekday, h]));

  return (
    <form action={action} className="card p-6 flex flex-col gap-3">
      {DAYS.map(({ wd, label }) => {
        const row = byDay.get(wd);
        const open = !!row;
        return (
          <div key={wd} className="flex items-center gap-4 py-1">
            <label className="flex items-center gap-2.5 w-40 cursor-pointer">
              <input
                type="checkbox"
                name={`open_${wd}`}
                defaultChecked={open}
                className="size-4 accent-ink"
              />
              <span className="font-medium text-[0.9375rem]">{label}</span>
            </label>
            <input
              type="time"
              name={`from_${wd}`}
              defaultValue={row ? row.open_time.slice(0, 5) : "09:00"}
              className="field-input h-10 w-32"
            />
            <span className="text-muted">tot</span>
            <input
              type="time"
              name={`to_${wd}`}
              defaultValue={row ? row.close_time.slice(0, 5) : "17:00"}
              className="field-input h-10 w-32"
            />
          </div>
        );
      })}

      <p className="text-[0.8125rem] text-muted">
        Vink een dag uit om die te sluiten. Je beschikbaarheid op de marktplaats volgt deze tijden.
      </p>

      {state.error && <p className="chip chip-alert w-fit">{state.error}</p>}
      {state.success && <p className="chip w-fit">Openingstijden opgeslagen.</p>}

      <button type="submit" className="btn btn-primary w-fit mt-2" disabled={pending}>
        {pending ? "Bezig…" : "Opslaan"}
      </button>
    </form>
  );
}
