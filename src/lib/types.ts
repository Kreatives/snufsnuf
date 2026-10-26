export type Species = "hond" | "kat";

export type SizeClass = "xxs" | "xs" | "s" | "m" | "l" | "xl";

export type CoatType = "glad" | "lang" | "krul" | "ruw" | "dubbel";

export type Skill = "angsthond" | "kat" | "handstrippen" | "senior" | "puppy";

export type ProviderCategory =
  | "trimsalon"
  | "kattentrimsalon"
  | "mobiele_trimmer";

export interface PricingRule {
  sizeClass: SizeClass;
  priceCents: number;
  durationMin: number;
}

export interface BreedException {
  breed: string;
  priceCents: number;
  durationMin: number;
}

export interface Service {
  id: string;
  providerId: string;
  species: Species;
  name: string;
  description: string;
  pricing: PricingRule[];
  /** extra duur en prijs per vachttype (telt op bij de maatklasse) */
  coatSurcharge: Partial<Record<CoatType, { extraMin: number; extraCents: number }>>;
  breedExceptions: BreedException[];
  requiredSkills: Skill[];
  bufferMin: number;
  indicative: boolean;
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
  | "opgehaald";

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
