import type { AgendaItem } from "@/lib/data";
import { AppointmentBlock } from "@/components/appointment-block";

interface Day {
  iso: string;
  short: string;
  dayNum: number;
  isToday: boolean;
}

const ROW_H = 56; // px per uur

export function WeekAgenda({
  days,
  items,
  startHour,
  endHour,
}: {
  days: Day[];
  items: AgendaItem[];
  startHour: number;
  endHour: number;
}) {
  const hours: number[] = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);
  const bodyHeight = hours.length * ROW_H;

  return (
    <div className="card overflow-x-auto">
      <div className="min-w-[820px]">
        {/* Dagkoppen */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-line">
          <div />
          {days.map((d) => (
            <div
              key={d.iso}
              className={`px-3 py-3 text-center border-l border-line ${d.isToday ? "bg-bg" : ""}`}
            >
              <p className="text-[0.75rem] text-muted uppercase tracking-wide">{d.short}</p>
              <p className={`text-[1.125rem] ${d.isToday ? "font-semibold" : "font-medium"}`}>
                {d.dayNum}
              </p>
            </div>
          ))}
        </div>

        {/* Tijdraster */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div>
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: ROW_H }}
                className="text-[0.6875rem] text-muted text-right pr-2 pt-1"
              >
                {h}:00
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayItems = items.filter((i) => i.dateISO === d.iso);
            return (
              <div
                key={d.iso}
                className={`relative border-l border-line ${d.isToday ? "bg-bg/60" : ""}`}
                style={{ height: bodyHeight }}
              >
                {hours.map((h) => (
                  <div key={h} style={{ height: ROW_H }} className="border-b border-line" />
                ))}

                {dayItems.map((i) => (
                  <AppointmentBlock
                    key={i.id}
                    item={i}
                    top={((i.startMin - startHour * 60) / 60) * ROW_H}
                    height={Math.max((i.durationMin / 60) * ROW_H - 2, 30)}
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
