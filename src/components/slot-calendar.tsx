"use client";

import { useState } from "react";
import Link from "next/link";
import type { Slot } from "@/lib/types";

const SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];

function groupByDate(slots: Slot[]): [string, Slot[]][] {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    if (!map.has(s.date)) map.set(s.date, []);
    map.get(s.date)!.push(s);
  }
  return [...map.entries()];
}

export function SlotCalendar({
  slots,
  selected,
  onSelect,
  linkBase,
}: {
  slots: Slot[];
  selected?: Slot | null;
  onSelect?: (s: Slot) => void;
  linkBase?: string;
}) {
  const grouped = groupByDate(slots);
  const dates = grouped.map(([d]) => d);
  const [active, setActive] = useState(selected?.date ?? dates[0] ?? "");
  const activeDate = dates.includes(active) ? active : dates[0];
  const times = grouped.find(([d]) => d === activeDate)?.[1] ?? [];

  if (dates.length === 0) {
    return <p className="text-muted text-[0.9375rem]">Geen vrije momenten beschikbaar.</p>;
  }

  const activeLabel = activeDate
    ? new Date(activeDate).toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {dates.map((d) => {
          const dt = new Date(d);
          const isActive = d === activeDate;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActive(d)}
              className={`shrink-0 w-14 rounded-md border px-1 py-2 text-center transition-colors ${
                isActive ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink"
              }`}
            >
              <span className={`block text-[0.6875rem] uppercase ${isActive ? "" : "text-muted"}`}>
                {SHORT[dt.getDay()]}
              </span>
              <span className="block text-[1.0625rem] font-medium leading-tight">
                {dt.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <p className="text-[0.875rem] font-medium mb-2 capitalize">{activeLabel}</p>
        <div className="flex flex-wrap gap-2">
          {times.map((s) => {
            if (linkBase) {
              return (
                <Link
                  key={s.time}
                  href={`${linkBase}?date=${s.date}&time=${s.time}`}
                  className="chip h-10 px-4 hover:border-ink hover:text-ink transition-colors"
                >
                  {s.time}
                </Link>
              );
            }
            const isSel = selected?.date === s.date && selected?.time === s.time;
            return (
              <button
                key={s.time}
                type="button"
                onClick={() => onSelect?.(s)}
                className={`chip h-10 px-4 transition-colors ${
                  isSel ? "chip-solid" : "hover:border-ink hover:text-ink"
                }`}
              >
                {s.time}
              </button>
            );
          })}
          {times.length === 0 && (
            <p className="text-muted text-[0.9375rem]">Geen vrije tijden op deze dag.</p>
          )}
        </div>
      </div>
    </div>
  );
}
