"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];
const DOW = ["ma", "di", "wo", "do", "vr", "za", "zo"];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toNL = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

function parseISO(s?: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const firstOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** 6 weken (42 dagen), maandag als eerste dag. */
function monthGrid(view: Date): Date[] {
  const first = firstOf(view);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
  return Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}

/** Zelf-ontworpen datumkiezer; schrijft naar een verborgen input name="date" (YYYY-MM-DD). */
export function DateField({ defaultValue }: { defaultValue?: string }) {
  const [selected, setSelected] = useState<Date | null>(() => parseISO(defaultValue));
  const [view, setView] = useState<Date>(() => parseISO(defaultValue) ?? new Date());
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = monthGrid(view);

  const pick = (d: Date) => {
    setSelected(d);
    setView(firstOf(d));
    setOpen(false);
  };
  const shiftMonth = (delta: number) =>
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));

  return (
    <div ref={wrap} className="relative flex-1">
      <input type="hidden" name="date" value={selected ? toISO(selected) : ""} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left rounded-full px-5 py-2.5 hover:bg-bg transition-colors"
      >
        <span className="block text-[0.75rem] font-semibold text-ink">Wanneer</span>
        <span className={`block text-[0.9375rem] ${selected ? "text-ink" : "text-muted"}`}>
          {selected ? toNL(selected) : "Datum kiezen"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-40 w-[320px] max-w-[calc(100vw-2.5rem)] card p-4 shadow-[0_14px_44px_rgba(20,20,19,0.18)]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-[1.05rem] text-ink capitalize">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Vorige maand"
                onClick={() => shiftMonth(-1)}
                className="size-8 rounded-full flex items-center justify-center text-ink hover:bg-bg transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Volgende maand"
                onClick={() => shiftMonth(1)}
                className="size-8 rounded-full flex items-center justify-center text-ink hover:bg-bg transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DOW.map((d) => (
              <span key={d} className="h-8 flex items-center justify-center text-[0.75rem] font-medium text-muted">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === view.getMonth();
              const isSel = selected != null && sameDay(d, selected);
              const isToday = sameDay(d, today);
              const isPast = d < todayStart;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => pick(d)}
                  className={`h-9 rounded-lg text-[0.875rem] transition-colors ${
                    isSel
                      ? "font-semibold text-white"
                      : isPast
                        ? "text-muted/40 cursor-not-allowed"
                        : inMonth
                          ? "text-ink hover:bg-bg"
                          : "text-muted hover:bg-bg"
                  } ${isToday && !isSel ? "ring-1 ring-inset ring-ink/25" : ""}`}
                  style={isSel ? { background: "#1F3A2E" } : undefined}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setOpen(false);
              }}
              className="text-[0.875rem] font-medium"
              style={{ color: "#C84E38" }}
            >
              Wissen
            </button>
            <button
              type="button"
              onClick={() => pick(today)}
              className="text-[0.875rem] font-medium text-ink"
            >
              Vandaag
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
