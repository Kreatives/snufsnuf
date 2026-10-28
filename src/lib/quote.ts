// Flexibele, provider-gedefinieerde prijsmotor (vervangt de harde maat×vacht-logica).
// Pure functie, geen IO. De bot (getQuote) en de boekingsflow gebruiken exact deze logica.

import type { Service, PriceRule, PriceRuleRow, SizeClass, CoatType } from "./types";

export interface QuotePet {
  size?: SizeClass | null;
  coat?: CoatType | null;
  weightKg?: number | null;
}

export interface AddonSelection {
  addonId: string;
  quantity: number;
}

export interface QuoteSelection {
  variantId?: string | null;
  addons?: AddonSelection[];
  /** aantal nachten voor per-nacht-diensten (pension/oppas) */
  nights?: number;
  /** aantal uren voor per-uur-oppas */
  hours?: number;
}

export interface BreakdownItem {
  label: string;
  deltaPriceCents: number;
  deltaDurationMin: number;
}

export interface Quote {
  totalCents: number;
  durationMin: number;
  isFromPrice: boolean;
  breakdown: BreakdownItem[];
}

const SIZE_LABEL: Record<SizeClass, string> = {
  xxs: "Maat XXS",
  xs: "Maat XS",
  s: "Maat S",
  m: "Maat M",
  l: "Maat L",
  xl: "Maat XL",
};
const COAT_LABEL: Record<CoatType, string> = {
  glad: "Gladde vacht",
  lang: "Lange vacht",
  krul: "Krulvacht",
  ruw: "Ruwe vacht",
  dubbel: "Dubbele vacht",
};

function petValue(pet: QuotePet, attribute: PriceRule["attribute"]): string | null {
  if (attribute === "size") return pet.size ?? null;
  if (attribute === "coat") return pet.coat ?? null;
  return null;
}

/** Matcht een gewicht (kg) tegen een bucket-label: "10-20", "<10", ">30", "20+". */
function weightMatches(value: string, kg: number | null | undefined): boolean {
  if (kg == null) return false;
  const v = value.replace(/\s|kg/gi, "");
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/)))
    return kg >= Number(m[1]) && kg <= Number(m[2]);
  if ((m = v.match(/^<(\d+(?:\.\d+)?)$/))) return kg < Number(m[1]);
  if ((m = v.match(/^>(\d+(?:\.\d+)?)$/))) return kg > Number(m[1]);
  if ((m = v.match(/^(\d+(?:\.\d+)?)\+$/))) return kg >= Number(m[1]);
  if ((m = v.match(/^(\d+(?:\.\d+)?)$/))) return kg === Number(m[1]);
  return false;
}

function ruleLabel(rule: PriceRule, row: PriceRuleRow): string {
  if (rule.attribute === "size" && row.value in SIZE_LABEL)
    return SIZE_LABEL[row.value as SizeClass];
  if (rule.attribute === "coat" && row.value in COAT_LABEL)
    return COAT_LABEL[row.value as CoatType];
  if (rule.attribute === "weight") return `Gewicht ${row.value}`;
  return row.value;
}

/**
 * total = (variant ? variant : basis) × nachten + prijsregels die matchen + extra's × aantal.
 * Duur wordt op dezelfde manier opgebouwd. Geeft ook de breakdown voor het overzicht terug.
 */
export function calculateQuote(
  service: Service,
  pet: QuotePet,
  selection: QuoteSelection = {},
): Quote {
  const breakdown: BreakdownItem[] = [];

  const variant = selection.variantId
    ? service.variants.find((v) => v.id === selection.variantId)
    : undefined;

  const unitPrice = variant ? variant.priceCents : service.basePriceCents;
  const unitDuration = variant ? variant.durationMin : service.baseDurationMin;

  let totalCents: number;
  let durationMin: number;
  let baseLabel: string;

  if (service.perNight) {
    const units = Math.max(selection.nights ?? service.minNights, service.minNights, 1);
    const pkg = service.packages.find((p) => p.nights === units);
    if (pkg) {
      totalCents = pkg.priceCents;
      baseLabel = `Pakket · ${units} ${units === 1 ? "nacht" : "nachten"}`;
    } else {
      totalCents = unitPrice * units;
      baseLabel = `${variant ? variant.name : "Per nacht"} × ${units} ${units === 1 ? "nacht" : "nachten"}`;
    }
    durationMin = unitDuration * units;
  } else if (service.perHour) {
    const units = Math.max(1, Math.round(selection.hours ?? 1));
    totalCents = unitPrice * units;
    durationMin = units * 60;
    baseLabel = `Per uur × ${units} uur`;
  } else {
    totalCents = unitPrice;
    durationMin = unitDuration;
    baseLabel = variant ? variant.name : "Basis";
  }

  breakdown.push({
    label: baseLabel,
    deltaPriceCents: totalCents,
    deltaDurationMin: durationMin,
  });

  for (const rule of service.priceRules) {
    if (!rule.enabled) continue;
    const row =
      rule.attribute === "weight"
        ? rule.rows.find((r) => weightMatches(r.value, pet.weightKg))
        : rule.rows.find((r) => r.value === petValue(pet, rule.attribute));
    if (!row) continue;
    if (row.deltaPriceCents === 0 && row.deltaDurationMin === 0) continue;
    totalCents += row.deltaPriceCents;
    durationMin += row.deltaDurationMin;
    breakdown.push({
      label: ruleLabel(rule, row),
      deltaPriceCents: row.deltaPriceCents,
      deltaDurationMin: row.deltaDurationMin,
    });
  }

  for (const sel of selection.addons ?? []) {
    const addon = service.addons.find((a) => a.id === sel.addonId);
    if (!addon) continue;
    const qty = addon.isPerUnit ? Math.max(1, Math.round(sel.quantity)) : 1;
    const price = addon.priceCents * qty;
    const dur = addon.durationMin * qty;
    totalCents += price;
    durationMin += dur;
    breakdown.push({
      label: addon.isPerUnit ? `${addon.name} × ${qty}` : addon.name,
      deltaPriceCents: price,
      deltaDurationMin: dur,
    });
  }

  return { totalCents, durationMin, isFromPrice: service.isFromPrice, breakdown };
}
