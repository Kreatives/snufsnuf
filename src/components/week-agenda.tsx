"use client";

import { useEffect, useRef } from "react";
import type { AgendaItem } from "@/lib/data";
import type { Slot } from "@/lib/types";
import { AppointmentBlock } from "@/components/appointment-block";

interface Day {
  iso: string;
  short: string;
  dayNum: number;
  isToday: boolean;
  weekday: number;
}

const ROW_H = 44; // px per uur
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const OPEN_TINT = "rgba(99, 143, 99, 0.14)";
const CLOSED_TINT = "rgba(20, 20, 19, 0.05)";
const EXCEPTION_TINT = "rgba(201, 160, 140, 0.20)";

export function WeekAgenda({
  days,
  items,
  allDayItems,
  rescheduleSlots,
  hours,
  exceptions,
}: {
  days: Day[];
  items: AgendaItem[];
  allDayItems: AgendaItem[];
  rescheduleSlots: Slot[];
  hours: Record<number, { open: number; close: number }>;
  exceptions: Record<string, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAllDay = allDayItems.length > 0;

  // Scroll bij laden naar het vroegste openingsuur (anders start je om middernacht).
  useEffect(() => {
    const opens = Object.values(hours).map((h) => h.open);
    const earliest = opens.length ? Math.min(...opens) : 8 * 60;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (earliest / 60) * ROW_H - ROW_H);
    }
  }, [hours]);

  return (
    <div ref={scrollRef} className="card overflow-auto max-h-[72vh]">
      <div className="min-w-[820px]">
        {/* Dagkoppen */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-line sticky top-0 bg-surface z-10">
          <div />
          {days.map((d) => {
            const reason = exceptions[d.iso];
            const closed = !!reason || !hours[d.weekday];
            return (
              <div
                key={d.iso}
                className={`px-2 py-2 text-center border-l border-line ${d.isToday ? "bg-bg" : ""}`}
              >
                <p className="text-[0.75rem] text-muted uppercase tracking-wide">{d.short}</p>
                <p className={`text-[1.0625rem] ${d.isToday ? "font-semibold" : "font-medium"}`}>
                  {d.dayNum}
                </p>
                {closed && (
                  <p className="text-[0.625rem] text-muted truncate leading-tight">
                    {reason || "Gesloten"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Hele-dag-balk voor meerdaagse oppas/verblijf */}
        {hasAllDay && (
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-line bg-surface">
            <div className="text-[0.625rem] text-muted text-right pr-2 pt-2">Hele dag</div>
            {days.map((d) => {
              const covering = allDayItems.filter(
                (i) => i.dateISO <= d.iso && d.iso <= (i.endDateISO ?? i.dateISO),
              );
              return (
                <div key={d.iso} className="border-l border-line p-1 flex flex-col gap-1 min-h-[2.5rem]">
                  {covering.map((i) => (
                    <AppointmentBlock
                      key={i.id}
                      item={i}
                      rescheduleSlots={rescheduleSlots}
                      allDay
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Tijdraster 0–24 */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: ROW_H }}
                className="text-[0.6875rem] text-muted text-right pr-2 pt-0.5"
              >
                {h}:00
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayItems = items.filter((i) => i.dateISO === d.iso);
            const h = hours[d.weekday];
            const reason = exceptions[d.iso];
            const fullHeight = 24 * ROW_H;
            return (
              <div
                key={d.iso}
                className={`relative border-l border-line ${d.isToday ? "bg-bg/40" : ""}`}
                style={{ height: fullHeight }}
              >
                {/* Achtergrond: gesloten dag, of getinte openingsuren */}
                {reason ? (
                  <div className="absolute inset-0" style={{ backgroundColor: EXCEPTION_TINT }} />
                ) : !h ? (
                  <div className="absolute inset-0" style={{ backgroundColor: CLOSED_TINT }} />
                ) : (
                  <div
                    className="absolute left-0 right-0"
                    style={{
                      top: (h.open / 60) * ROW_H,
                      height: ((h.close - h.open) / 60) * ROW_H,
                      backgroundColor: OPEN_TINT,
                    }}
                  />
                )}

                {/* Uurlijnen */}
                {HOURS.map((hh) => (
                  <div
                    key={hh}
                    style={{ top: hh * ROW_H }}
                    className="absolute left-0 right-0 border-t border-line"
                  />
                ))}

                {/* Afspraken */}
                {dayItems.map((i) => (
                  <AppointmentBlock
                    key={i.id}
                    item={i}
                    rescheduleSlots={rescheduleSlots}
                    top={(i.startMin / 60) * ROW_H}
                    height={Math.max((i.durationMin / 60) * ROW_H - 2, 26)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
