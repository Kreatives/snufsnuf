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
  description: string;
  pricing: Service["pricing"];
  coat_surcharge: Service["coatSurcharge"];
  breed_exceptions: Service["breedExceptions"];
  required_skills: Service["requiredSkills"];
  buffer_min: number;
  indicative: boolean;
};

function mapService(r: ServiceRow): Service {
  return {
    id: r.id,
    providerId: r.provider_id,
    species: r.species,
    name: r.name,
    description: r.description,
    pricing: r.pricing,
    coatSurcharge: r.coat_surcharge,
    breedExceptions: r.breed_exceptions,
    requiredSkills: r.required_skills,
    bufferMin: r.buffer_min,
    indicative: r.indicative,
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
  const { data } = await supabase
    .from("animals")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as AnimalRow[] | null)?.map(mapAnimal) ?? [];
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
  status: AppointmentStatus;
};

export async function getTodayAppointments(providerSlug: string): Promise<Appointment[]> {
  const supabase = await db();
  const provider = await getProviderBySlug(providerSlug);
  if (!provider) return [];

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("provider_id", provider.id)
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  return (data as AppointmentRow[] | null)?.map((r) => ({
    id: r.id,
    time: new Date(r.starts_at).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Amsterdam",
    }),
    durationMin: r.duration_min,
    owner: r.owner_name,
    serviceName: r.service_name,
    staff: r.staff,
    status: r.status,
    animal: {
      id: r.id,
      name: r.animal.name,
      species: "hond",
      breed: r.animal.breed,
      sizeClass: r.animal.sizeClass,
      coatType: r.animal.coatType,
      weightKg: 0,
      behavior: r.animal.behavior ?? [],
      biteRisk: r.animal.biteRisk,
      muzzleRequired: r.animal.muzzleRequired,
      medicalNote: r.animal.medicalNote ?? null,
      topNote: r.animal.topNote ?? null,
    },
  })) ?? [];
}
