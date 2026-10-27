export type Species = "hond" | "kat";

export type SizeClass = "xxs" | "xs" | "s" | "m" | "l" | "xl";

export type CoatType = "glad" | "lang" | "krul" | "ruw" | "dubbel";

export type Skill = "angsthond" | "kat" | "handstrippen" | "senior" | "puppy";

export type ProviderCategory =
  | "trimsalon"
  | "kattentrimsalon"
  | "mobiele_trimmer"
  | "dagopvang"
  | "pension"
  | "uitlaatservice"
  | "oppas";

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
  /** gestandaardiseerde waarde: maat (xs..xl), vacht (glad..dubbel) of gewicht-bucket (">20") */
  value: string;
  deltaPriceCents: number;
  deltaDurationMin: number;
}

export interface PriceRule {
  id: string;
  attribute: "size" | "coat" | "weight";
  enabled: boolean;
  rows: PriceRuleRow[];
}

/**
 * Provider-gedefinieerde dienst (Salonized-stijl). Basisprijs + -duur zijn altijd
 * gevuld zodat de bot altijd "vanaf €X" kan quoten. Varianten vervangen de basis,
 * extra's tellen erbij op, prijsregels passen de basis aan op pet-attributen.
 */
export interface Service {
  id: string;
  providerId: string;
  species: Species;
  name: string;
  category: string;
  description: string;
  basePriceCents: number;
  baseDurationMin: number;
  isFromPrice: boolean;
  variants: Variant[];
  addons: Addon[];
  priceRules: PriceRule[];
  /** meerdaagse verblijven: basisprijs geldt per nacht, boeking kiest een datumbereik */
  perNight: boolean;
  minNights: number;
  requiredSkills: Skill[];
  bufferMin: number;
}

export interface Provider {
  id: string;
  slug: string;
  name: string;
  category: ProviderCategory;
  owner: string;
  city: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  blurb: string;
  species: Species[];
  skills: Skill[];
  prikkelarm: boolean;
  mobiel: boolean;
}

export interface Animal {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  sizeClass: SizeClass;
  coatType: CoatType;
  weightKg: number;
  behavior: string[];
  biteRisk: 0 | 1 | 2 | 3;
  muzzleRequired: boolean;
  medicalNote: string | null;
  topNote: string | null;
}

export type AppointmentStatus =
  | "aanvraag"
  | "bevestigd"
  | "verwacht"
  | "aanwezig"
  | "in_behandeling"
  | "klaar"
  | "opgehaald"
  | "no_show"
  | "geannuleerd";

export interface Appointment {
  id: string;
  time: string; // "09:30"
  durationMin: number;
  animal: Animal;
  owner: string;
  serviceName: string;
  staff: string;
  status: AppointmentStatus;
}

export interface Slot {
  date: string; // ISO date
  time: string; // "10:00"
  staff: string;
}
