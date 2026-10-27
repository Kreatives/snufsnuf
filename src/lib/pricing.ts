import type { Service, SizeClass, CoatType } from "./types";

export const SIZE_LABELS: Record<SizeClass, string> = {
  xxs: "XXS",
  xs: "XS",
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
};

export const COAT_LABELS: Record<CoatType, string> = {
  glad: "gladde vacht",
  lang: "lange vacht",
  krul: "krulvacht",
  ruw: "ruwe vacht",
  dubbel: "dubbele vacht",
};

/** "Vanaf"-prijs: de goedkoopste variant als die er zijn, anders de basisprijs. */
export function fromPrice(service: Service): number {
  if (service.variants.length > 0) {
    return Math.min(...service.variants.map((v) => v.priceCents));
  }
  return service.basePriceCents;
}

export function euro(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return sign + "€" + (Math.abs(cents) / 100).toFixed(2).replace(".", ",");
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} uur`;
  return `${h}u ${m}m`;
}
