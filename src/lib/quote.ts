// Flexibele, provider-gedefinieerde prijsmotor (vervangt de harde maat×vacht-logica).
// Pure functie, geen IO. De bot (getQuote) en de boekingsflow gebruiken exact deze logica.

export type PetSize = "XS" | "S" | "M" | "L" | "XL";
export type PetCoat = "short" | "long" | "curly" | "wire" | "double" | "hairless";

export interface QuotePet {
  size?: PetSize | null;
  coat?: PetCoat | null;
  weightKg?: number | null;
}

export interface Variant {
  id: string;
  name: string;
  priceCents: number;
  durationMin: number;
}

export interface Addon {
  id: string;
  name: string;
  priceCents: number;
  durationMin: number;
  isPerUnit: boolean;
  unitLabel?: string;
}

export interface PriceRuleRow {
  value: string; // "L", "curly", "10-20", "<10", ">30"
  deltaPriceCents: number;
  deltaDurationMin: number;
}

export interface PriceRule {
  id: string;
  attribute: "size" | "coat" | "weight";
  enabled: boolean;
  rows: PriceRuleRow[];
}

export interface QuoteService {
  basePriceCents: number;
  baseDurationMin: number;
  isFromPrice: boolean;
  variants: Variant[];
  addons: Addon[];
  priceRules: PriceRule[];
}

export interface AddonSelection {
  addonId: string;
  quantity: number;
}

export interface QuoteSelection {
  variantId?: string | null;
  addons?: AddonSelection[];
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

const SIZE_LABEL: Record<PetSize, string> = {
  XS: "Maat XS",
  S: "Maat S",
  M: "Maat M",
  L: "Maat L",
  XL: "Maat XL",
};
const COAT_LABEL: Record<PetCoat, string> = {
  short: "Korte vacht",
  long: "Lange vacht",
  curly: "Krulvacht",
  wire: "Ruwe vacht",
  double: "Dubbele vacht",
  hairless: "Haarloos",
};

/** Waarde van het dier voor een attribuut, als string voor exacte-match-regels. */
function petValue(pet: QuotePet, attribute: PriceRule["attribute"]): string | null {
  if (attribute === "size") return pet.size ?? null;
  if (attribute === "coat") return pet.coat ?? null;
  return null; // gewicht matcht via buckets, zie weightMatches
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
    return SIZE_LABEL[row.value as PetSize];
  if (rule.attribute === "coat" && row.value in COAT_LABEL)
    return COAT_LABEL[row.value as PetCoat];
  if (rule.attribute === "weight") return `Gewicht ${row.value}`;
  return row.value;
}

/**
 * total = (variant ? variant : basis) + ingeschakelde prijsregels die matchen + geselecteerde extra's × aantal.
 * Duur wordt op dezelfde manier opgeteld.
 */
export function calculateQuote(
  service: QuoteService,
  pet: QuotePet,
  selection: QuoteSelection = {},
): Quote {
  const breakdown: BreakdownItem[] = [];

  // 1. Basis of variant
  const variant = selection.variantId
    ? service.variants.find((v) => v.id === selection.variantId)
    : undefined;

  let totalCents = variant ? variant.priceCents : service.basePriceCents;
  let durationMin = variant ? variant.durationMin : service.baseDurationMin;
  breakdown.push({
    label: variant ? variant.name : "Basis",
    deltaPriceCents: totalCents,
    deltaDurationMin: durationMin,
  });

  // 2. Prijsregels (max één per attribuut)
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

  // 3. Extra's × aantal
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
