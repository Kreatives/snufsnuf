"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { SizeClass, CoatType } from "./types";

/** Berekent de UTC-offset van Europe/Amsterdam voor een gegeven datum (DST-correct). */
function amsterdamOffset(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    timeZoneName: "longOffset",
  }).formatToParts(d);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  const m = tz.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : "+01:00";
}

export interface BookingInput {
  providerId: string;
  serviceId: string;
  serviceName: string;
  staff: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMin: number;
  priceCents: number;
  isRequest: boolean;
  idempotencyKey: string;
  owner: string;
  animal: {
    name: string;
    breed: string | null;
    sizeClass: SizeClass;
    coatType: CoatType;
    biteRisk: number;
    muzzleRequired: boolean;
    behavior: string[];
  };
  intake: Record<string, string>;
}

export async function createBooking(
  input: BookingInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient(await cookies());

  const startsAt = `${input.date}T${input.time}:00${amsterdamOffset(input.date)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Idempotent: dezelfde sleutel levert nooit een tweede afspraak op (R-04).
  const { data: existing } = await supabase
    .from("appointments")
    .select("id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing) return { ok: true, id: (existing as { id: string }).id };

  // Overlapcontrole: het slot mag niet botsen met een bestaande afspraak (geen dubbelboeking).
  const startMs = Date.parse(startsAt);
  const endMs = startMs + input.durationMin * 60000;
  const windowStart = new Date(startMs - 24 * 60 * 60 * 1000).toISOString();
  const { data: sameDay } = await supabase
    .from("appointments")
    .select("starts_at, duration_min, status")
    .eq("provider_id", input.providerId)
    .gte("starts_at", windowStart)
    .lt("starts_at", new Date(endMs).toISOString());
  const clash = (sameDay as { starts_at: string; duration_min: number; status: string }[] | null)?.some(
    (a) => {
      if (a.status === "geannuleerd" || a.status === "no_show") return false;
      const aStart = Date.parse(a.starts_at);
      const aEnd = aStart + a.duration_min * 60000;
      return aStart < endMs && aEnd > startMs;
    },
  );
  if (clash) {
    return { ok: false, error: "Dit moment is net geboekt. Kies een ander tijdstip." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("holds").insert({
    provider_id: input.providerId,
    service_id: input.serviceId,
    starts_at: startsAt,
    expires_at: expiresAt,
    idempotency_key: input.idempotencyKey,
  });

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      provider_id: input.providerId,
      service_id: input.serviceId,
      owner_user_id: user?.id ?? null,
      animal: input.animal,
      owner_name: input.owner,
      service_name: input.serviceName,
      staff: input.staff,
      starts_at: startsAt,
      duration_min: input.durationMin,
      price_cents: input.priceCents,
      status: input.isRequest ? "aanvraag" : "bevestigd",
      intake: input.intake,
      idempotency_key: input.idempotencyKey,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: (data as { id: string }).id };
}

export interface StayInput {
  providerId: string;
  serviceId: string;
  serviceName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dropoff: string; // HH:mm
  pickup: string;
  nights: number;
  priceCents: number;
  addons: string[];
  idempotencyKey: string;
  owner: string;
  animal: { name: string; species: string; behavior: string[]; biteRisk: number; muzzleRequired: boolean };
  intake: Record<string, string>;
}

export async function createStayBooking(
  input: StayInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient(await cookies());

  const startsAt = `${input.startDate}T${input.dropoff}:00${amsterdamOffset(input.startDate)}`;
  const endsAt = `${input.endDate}T${input.pickup}:00${amsterdamOffset(input.endDate)}`;

  const { data: existing } = await supabase
    .from("appointments")
    .select("id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (existing) return { ok: true, id: (existing as { id: string }).id };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      provider_id: input.providerId,
      service_id: input.serviceId,
      owner_user_id: user?.id ?? null,
      animal: input.animal,
      owner_name: input.owner,
      service_name: input.serviceName,
      staff: "",
      starts_at: startsAt,
      ends_at: endsAt,
      duration_min: input.nights * 24 * 60,
      price_cents: input.priceCents,
      status: "bevestigd",
      intake: {
        ...input.intake,
        dropoff: input.dropoff,
        pickup: input.pickup,
        nights: String(input.nights),
        addons: input.addons.join(", "),
      },
      idempotency_key: input.idempotencyKey,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: (data as { id: string }).id };
}
