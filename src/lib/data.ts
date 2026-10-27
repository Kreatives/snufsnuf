import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type {
  Provider,
  Service,
  Animal,
  Appointment,
  AppointmentStatus,
} from "./types";

async function db() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/* ── mapping van snake_case rijen naar domeintypes ─────────────────────────── */

type ProviderRow = {
  id: string;
  slug: string;
  name: string;
  category: Provider["category"];
  owner: string;
  city: string;
  distance_km: number;
  rating: number;
  review_count: number;
  blurb: string;
  species: Provider["species"];
  skills: Provider["skills"];
  prikkelarm: boolean;
  mobiel: boolean;
};

function mapProvider(r: ProviderRow): Provider {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    owner: r.owner,
    city: r.city,
    distanceKm: Number(r.distance_km),
    rating: Number(r.rating),
    reviewCount: r.review_count,
    blurb: r.blurb,
    species: r.species,
    skills: r.skills,
    prikkelarm: r.prikkelarm,
    mobiel: r.mobiel,
  };
}

type ServiceRow = {
  id: string;
  provider_id: string;
  species: Service["species"];
  name: string;
  category: string | null;
  description: string;
  base_price_cents: number;
  base_duration_min: number;
  is_from_price: boolean;
  variants: Service["variants"];
  addons: Service["addons"];
  price_rules: Service["priceRules"];
  per_night: boolean;
  min_nights: number;
  required_skills: Service["requiredSkills"];
  buffer_min: number;
};

function mapService(r: ServiceRow): Service {
  return {
    id: r.id,
    providerId: r.provider_id,
    species: r.species,
    name: r.name,
    category: r.category ?? "",
    description: r.description,
    basePriceCents: r.base_price_cents ?? 0,
    baseDurationMin: r.base_duration_min ?? 0,
    isFromPrice: r.is_from_price ?? false,
    variants: r.variants ?? [],
    addons: r.addons ?? [],
    priceRules: r.price_rules ?? [],
    perNight: r.per_night ?? false,
    minNights: r.min_nights ?? 1,
    requiredSkills: r.required_skills ?? [],
    bufferMin: r.buffer_min ?? 0,
  };
}

type AnimalRow = {
  id: string;
  name: string;
  species: Animal["species"];
  breed: string | null;
  size_class: Animal["sizeClass"];
  coat_type: Animal["coatType"];
  weight_kg: number | null;
  behavior: string[];
  bite_risk: Animal["biteRisk"];
  muzzle_required: boolean;
  medical_note: string | null;
  top_note: string | null;
  photo_url: string | null;
};

function mapAnimal(r: AnimalRow): Animal {
  return {
    id: r.id,
    name: r.name,
    species: r.species,
    breed: r.breed,
    sizeClass: r.size_class,
    coatType: r.coat_type,
    weightKg: r.weight_kg ?? 0,
    behavior: r.behavior,
    biteRisk: r.bite_risk,
    muzzleRequired: r.muzzle_required,
    medicalNote: r.medical_note,
    topNote: r.top_note,
  };
}

/* ── reads ─────────────────────────────────────────────────────────────────── */

export async function getProviders(): Promise<Provider[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("providers")
    .select("*")
    .order("distance_km", { ascending: true });
  return (data as ProviderRow[] | null)?.map(mapProvider) ?? [];
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const supabase = await db();
  const { data } = await supabase.from("providers").select("*").eq("slug", slug).maybeSingle();
  return data ? mapProvider(data as ProviderRow) : null;
}

export async function getServicesByProvider(providerId: string): Promise<Service[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: true });
  return (data as ServiceRow[] | null)?.map(mapService) ?? [];
}

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = await db();
  const { data } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  return data ? mapService(data as ServiceRow) : null;
}

export async function getSavedAnimals(): Promise<Animal[]> {
  const supabase = await db();
  // RLS beperkt dit tot de dieren van de ingelogde baasje; gast → leeg.
  const { data } = await supabase
    .from("animals")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as AnimalRow[] | null)?.map(mapAnimal) ?? [];
}

export async function getProviderHours(
  providerId: string,
): Promise<{ weekday: number; open_time: string; close_time: string }[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("provider_hours")
    .select("weekday, open_time, close_time")
    .eq("provider_id", providerId);
  return (data as { weekday: number; open_time: string; close_time: string }[] | null) ?? [];
}

export interface MyAppointment {
  id: string;
  dayLabel: string;
  time: string;
  durationMin: number;
  priceCents: number;
  status: AppointmentStatus;
  serviceName: string;
  animalName: string;
  providerName: string;
  providerSlug: string;
  isPast: boolean;
  isStay: boolean;
}

/** Afspraken van de ingelogde baasje, nieuw naar oud. */
export async function getMyAppointments(): Promise<MyAppointment[]> {
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("appointments")
    .select("*, providers(name, slug)")
    .eq("owner_user_id", user.id)
    .order("starts_at", { ascending: false });

  const now = Date.now();
  type Row = {
    id: string;
    starts_at: string;
    ends_at: string | null;
    duration_min: number;
    price_cents: number;
    status: AppointmentStatus;
    service_name: string;
    animal: { name: string };
    providers: { name: string; slug: string } | null;
  };
  return ((data as Row[] | null) ?? []).map((r) => {
    const d = new Date(r.starts_at);
    return {
      id: r.id,
      dayLabel: d.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Amsterdam",
      }),
      time: d.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Amsterdam",
      }),
      durationMin: r.duration_min,
      priceCents: r.price_cents,
      status: r.status,
      serviceName: r.service_name,
      animalName: r.animal?.name ?? "",
      providerName: r.providers?.name ?? "",
      providerSlug: r.providers?.slug ?? "",
      isPast: Date.parse(r.starts_at) < now,
      isStay: !!r.ends_at,
    };
  });
}

export async function getProviderExceptions(
  providerId: string,
): Promise<{ id: string; date: string; reason: string }[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("schedule_exceptions")
    .select("id, date, reason")
    .eq("provider_id", providerId)
    .order("date", { ascending: true });
  return (data as { id: string; date: string; reason: string }[] | null) ?? [];
}

/** De salon van de ingelogde aanbieder (eigenaar), ongeacht status. */
export async function getOwnedProvider(): Promise<Provider | null> {
  const supabase = await db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("providers")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  return data ? mapProvider(data as ProviderRow) : null;
}

type AppointmentRow = {
  id: string;
  animal: {
    name: string;
    breed: string | null;
    sizeClass: Animal["sizeClass"];
    coatType: Animal["coatType"];
    biteRisk: Animal["biteRisk"];
    muzzleRequired: boolean;
    behavior: string[];
    medicalNote?: string | null;
    topNote?: string | null;
  };
  owner_name: string;
  service_name: string;
  staff: string;
  starts_at: string;
  duration_min: number;
  price_cents: number;
  status: AppointmentStatus;
  intake: Record<string, string> | null;
  is_block: boolean;
};

export interface AgendaItem {
  id: string;
  dateISO: string; // YYYY-MM-DD in Europe/Amsterdam
  dayLabel: string; // "woensdag 28 oktober"
  startMin: number; // minuten sinds middernacht (Amsterdam)
  durationMin: number;
  time: string; // "09:00"
  title: string;
  status: AppointmentStatus;
  priceCents: number;
  // dier
  animalName: string;
  breed: string | null;
  sizeClass: Animal["sizeClass"];
  coatType: Animal["coatType"];
  behavior: string[];
  biteRisk: number;
  muzzle: boolean;
  medicalNote: string | null;
  topNote: string | null;
  // boeker
  owner: string;
  email: string | null;
  phone: string | null;
  lastGroom: string | null;
  isBlock: boolean;
}

/** Afspraken binnen een datumbereik, voor het weekoverzicht in het dashboard. */
export async function getAgendaItems(
  providerId: string,
  start: Date,
  end: Date,
): Promise<AgendaItem[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("provider_id", providerId)
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  return (data as AppointmentRow[] | null)?.map((r) => {
    const d = new Date(r.starts_at);
    const dateISO = d.toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Amsterdam",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
    const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    const intake = r.intake ?? {};
    return {
      id: r.id,
      dateISO,
      dayLabel: d.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/Amsterdam",
      }),
      startMin: hh * 60 + mm,
      durationMin: r.duration_min,
      time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
      title: r.service_name,
      status: r.status,
      priceCents: r.price_cents,
      animalName: r.animal.name,
      breed: r.animal.breed ?? null,
      sizeClass: r.animal.sizeClass,
      coatType: r.animal.coatType,
      behavior: r.animal.behavior ?? [],
      biteRisk: r.animal.biteRisk ?? 0,
      muzzle: r.animal.muzzleRequired ?? false,
      medicalNote: r.animal.medicalNote ?? null,
      topNote: r.animal.topNote ?? null,
      owner: r.owner_name,
      email: intake.email ?? null,
      phone: intake.phone ?? null,
      lastGroom: intake.lastGroom ?? null,
      isBlock: r.is_block ?? false,
    };
  }) ?? [];
}
