import type { Slot } from "./types";

/**
 * Deterministische slotgeneratie voor de komende dagen. Dit is een prototype-stand-in
 * voor de echte beschikbaarheidsmotor (rooster − afspraken − holds), die in een latere
 * fase uit de database komt. Het patroon hangt aan de provider-slug zodat elke salon
 * een herkenbare agenda heeft.
 */
export function getSlots(providerSlug: string, days = 5): Slot[] {
  const patterns: Record<string, string[]> = {
    "trimsalon-sanne": ["09:00", "10:30", "13:30", "15:00"],
    "salon-mark-team": ["09:00", "09:30", "11:00", "13:00", "14:30", "16:00"],
    "kattentrim-iris": ["10:00", "13:00"],
    "mobiel-youssef": ["08:30", "10:00", "11:30", "14:00"],
  };
  const staffName: Record<string, string> = {
    "trimsalon-sanne": "Sanne",
    "salon-mark-team": "Noa",
    "kattentrim-iris": "Iris",
    "mobiel-youssef": "Youssef",
  };
  const times = patterns[providerSlug] ?? ["10:00", "14:00"];
  const slots: Slot[] = [];
  const today = new Date();
  for (let d = 1; d <= days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    if (date.getDay() === 0) continue; // zondag dicht
    const iso = date.toISOString().slice(0, 10);
    const available = d === 1 ? times.slice(0, 2) : times;
    for (const time of available) {
      slots.push({ date: iso, time, staff: staffName[providerSlug] ?? "Team" });
    }
  }
  return slots;
}
