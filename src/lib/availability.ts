import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Slot } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Datum (YYYY-MM-DD) en minuten-sinds-middernacht van een tijdstip in Europe/Amsterdam. */
function amsParts(d: Date): { date: string; min: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    min: Number(hour) * 60 + Number(get("minute")),
  };
}

interface Options {
  days?: number;
  stepMin?: number;
  durationMin?: number;
}

/**
 * Echte beschikbaarheid: slots uit de openingstijden van de aanbieder, minus de
 * tijden die al door een afspraak bezet zijn. Vervangt de oude vaste slotgeneratie.
 */
export async function getAvailableSlots(
  providerId: string,
  { days = 7, stepMin = 30, durationMin = 60 }: Options = {},
): Promise<Slot[]> {
  const supabase = await createClient(await cookies());

  const { data: hoursRows } = await supabase
    .from("provider_hours")
    .select("weekday, open_time, close_time")
    .eq("provider_id", providerId);
  if (!hoursRows || hoursRows.length === 0) return [];

  const { data: exceptionRows } = await supabase
    .from("schedule_exceptions")
    .select("date")
    .eq("provider_id", providerId);
  const closedDates = new Set((exceptionRows as { date: string }[] | null)?.map((r) => r.date) ?? []);

  const hours = new Map<number, { open: number; close: number }>();
  for (const h of hoursRows as { weekday: number; open_time: string; close_time: string }[]) {
    const [oh, om] = h.open_time.split(":").map(Number);
    const [ch, cm] = h.close_time.split(":").map(Number);
    hours.set(h.weekday, { open: oh * 60 + om, close: ch * 60 + cm });
  }

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + days + 1);

  const { data: apts } = await supabase
    .from("appointments")
    .select("starts_at, duration_min")
    .eq("provider_id", providerId)
    .gte("starts_at", now.toISOString())
    .lt("starts_at", windowEnd.toISOString());

  const busy: Record<string, [number, number][]> = {};
  for (const a of (apts ?? []) as { starts_at: string; duration_min: number }[]) {
    const { date, min } = amsParts(new Date(a.starts_at));
    (busy[date] ||= []).push([min, min + a.duration_min]);
  }

  const slots: Slot[] = [];
  for (let offset = 1; offset <= days; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    day.setHours(12, 0, 0, 0);
    const h = hours.get(day.getDay());
    if (!h) continue;

    const iso = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    if (closedDates.has(iso)) continue;
    for (let t = h.open; t + durationMin <= h.close; t += stepMin) {
      const taken = (busy[iso] ?? []).some(([s, e]) => t < e && t + durationMin > s);
      if (taken) continue;
      slots.push({ date: iso, time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`, staff: "" });
    }
  }
  return slots;
}
