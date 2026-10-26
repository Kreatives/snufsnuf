import type { Service, SizeClass, CoatType } from "./types";

export interface PriceResult {
  fromCents: number;
  durationMin: number;
  /** true zodra vacht of een "vanaf"-dienst meespeelt → altijd als vanaf-prijs tonen */
  isIndicative: boolean;
  /** uitleg van hoe het bedrag is opgebouwd, voor transparantie naar de klant */
  breakdown: { label: string; cents: number; min: number }[];
}

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

/**
 * Pure prijs- en duurmotor. Input komt volledig uit records (dienst + dier).
 * Resolutie-volgorde: ras-uitzondering > maatklasse + vachttoeslag.
 */
export function resolvePrice(
  service: Service,
  animal: { sizeClass: SizeClass; coatType: CoatType; breed: string | null },
): PriceResult | null {
  const breakdown: PriceResult["breakdown"] = [];

  // 1. Ras-uitzondering wint altijd (B-04)
  const breedRule = animal.breed
    ? service.breedExceptions.find(
        (b) => b.breed.toLowerCase() === animal.breed!.toLowerCase(),
      )
    : undefined;

  if (breedRule) {
    breakdown.push({
      label: `${breedRule.breed} (ras-tarief)`,
      cents: breedRule.priceCents,
      min: breedRule.durationMin,
    });
    return {
      fromCents: breedRule.priceCents,
      durationMin: breedRule.durationMin,
      isIndicative: service.indicative,
      breakdown,
    };
  }

  // 2. Maatklasse-basis
  const base = service.pricing.find((p) => p.sizeClass === animal.sizeClass);
  if (!base) return null;

  breakdown.push({
    label: `Maat ${SIZE_LABELS[animal.sizeClass]}`,
    cents: base.priceCents,
    min: base.durationMin,
  });

  let cents = base.priceCents;
  let min = base.durationMin;

  // 3. Vachttoeslag telt op (B-06)
  const coat = service.coatSurcharge[animal.coatType];
  if (coat && (coat.extraCents > 0 || coat.extraMin > 0)) {
    cents += coat.extraCents;
    min += coat.extraMin;
    breakdown.push({
      label: COAT_LABELS[animal.coatType],
      cents: coat.extraCents,
      min: coat.extraMin,
    });
  }

  return {
    fromCents: cents,
    durationMin: min,
    isIndicative: service.indicative || !!coat,
    breakdown,
  };
}

/** Laagste "vanaf"-prijs over alle maatklassen, voor de aanbiederkaart (I-13) */
export function fromPrice(service: Service): number {
  const prices = service.pricing.map((p) => p.priceCents);
  const breedPrices = service.breedExceptions.map((b) => b.priceCents);
  return Math.min(...prices, ...breedPrices);
}

export function euro(cents: number): string {
  return "€" + (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} uur`;
  return `${h}u ${m}m`;
}
