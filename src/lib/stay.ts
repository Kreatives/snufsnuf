import type { ProviderCategory } from "./types";

/** Categorieën die op datumbereik werken (verblijf) i.p.v. losse tijdsloten. */
export function isStayProvider(category: ProviderCategory): boolean {
  return category === "oppas" || category === "pension" || category === "dagopvang";
}

/** Keuzelijst voor breng- en ophaaltijden. */
export const DAY_TIMES = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

/** Aantal nachten tussen twee YYYY-MM-DD datums (minimaal 1). */
export function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(start + "T00:00:00Z").getTime();
  const b = new Date(end + "T00:00:00Z").getTime();
  const diff = Math.round((b - a) / 86400000);
  return diff > 0 ? diff : 0;
}
