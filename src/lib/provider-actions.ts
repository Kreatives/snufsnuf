"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionState } from "./auth-actions";
import type { Variant, Addon } from "./types";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // ma..zo

const centsOf = (v: FormDataEntryValue | null): number => {
  const n = Number(String(v ?? "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const numOf = (v: FormDataEntryValue | null): number => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const uid = (): string => crypto.randomUUID();

async function ownerProviderId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/* ── Openingstijden opslaan ──────────────────────────────────────────────── */
export async function saveHoursAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const rows: { provider_id: string; weekday: number; open_time: string; close_time: string }[] =
    [];
  for (const wd of WEEKDAYS) {
    if (formData.get(`open_${wd}`) !== "on") continue;
    const open = String(formData.get(`from_${wd}`) || "");
    const close = String(formData.get(`to_${wd}`) || "");
    if (!open || !close || open >= close) continue;
    rows.push({ provider_id: providerId!, weekday: wd, open_time: open, close_time: close });
  }

  await supabase.from("provider_hours").delete().eq("provider_id", providerId!);
  if (rows.length > 0) {
    const { error } = await supabase.from("provider_hours").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/openingstijden");
  revalidatePath(`/`);
  return { success: true };
}

/* ── Dienst-formulier parsen (gedeeld door aanmaken en bewerken) ─────────── */
interface ServicePayload {
  species: string;
  name: string;
  description: string;
  base_price_cents: number;
  base_duration_min: number;
  is_from_price: boolean;
  variants: Variant[];
  addons: Addon[];
  per_night: boolean;
  per_hour: boolean;
  min_nights: number;
  packages: { nights: number; priceCents: number }[];
}

function parseServiceForm(formData: FormData): { error?: string; payload?: ServicePayload } {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const species = String(formData.get("species") || "hond");
  const isFromPrice = formData.get("is_from_price") === "on";
  const minNights = Math.max(1, numOf(formData.get("min_nights")) || 1);
  const isOppas = formData.get("is_oppas") === "on";
  const oppasUnit = String(formData.get("oppas_unit") || "nacht");

  if (!name) return { error: "Geef het product een naam." };

  const addons: Addon[] = [];
  for (let i = 0; i < numOf(formData.get("addon_count")); i++) {
    const aName = String(formData.get(`addon_name_${i}`) || "").trim();
    const price = centsOf(formData.get(`addon_price_${i}`));
    if (aName && price !== 0) {
      addons.push({
        id: uid(),
        name: aName,
        priceCents: price,
        durationMin: numOf(formData.get(`addon_dur_${i}`)),
        isPerUnit: formData.get(`addon_perunit_${i}`) === "on",
      });
    }
  }

  // ── Oppasproduct: per nacht of per uur, geen varianten ──
  if (isOppas) {
    const base = centsOf(formData.get("base_price"));
    if (!(base > 0)) return { error: "Vul een tarief in." };

    const packages: { nights: number; priceCents: number }[] = [];
    if (oppasUnit === "nacht") {
      for (let i = 0; i < numOf(formData.get("pkg_count")); i++) {
        const nights = numOf(formData.get(`pkg_nights_${i}`));
        const price = centsOf(formData.get(`pkg_price_${i}`));
        if (nights > 0 && price > 0) packages.push({ nights, priceCents: price });
      }
      packages.sort((a, b) => a.nights - b.nights);
      for (let i = 1; i < packages.length; i++) {
        if (packages[i].nights === packages[i - 1].nights) {
          return { error: `Je hebt twee pakketten met ${packages[i].nights} nachten.` };
        }
        if (packages[i].priceCents <= packages[i - 1].priceCents) {
          return {
            error: `Een pakket van ${packages[i].nights} nachten mag niet goedkoper zijn dan een pakket van ${packages[i - 1].nights} nachten.`,
          };
        }
      }
    }

    return {
      payload: {
        species,
        name,
        description,
        base_price_cents: base,
        base_duration_min: 0,
        is_from_price: isFromPrice,
        variants: [],
        addons,
        per_night: oppasUnit === "nacht",
        per_hour: oppasUnit === "uur",
        min_nights: minNights,
        packages,
      },
    };
  }

  // ── Normaal product: basis of varianten ──
  const variants: Variant[] = [];
  for (let i = 0; i < numOf(formData.get("variant_count")); i++) {
    const vName = String(formData.get(`variant_name_${i}`) || "").trim();
    const price = centsOf(formData.get(`variant_price_${i}`));
    if (vName && price > 0) {
      variants.push({
        id: uid(),
        name: vName,
        priceCents: price,
        durationMin: numOf(formData.get(`variant_dur_${i}`)),
      });
    }
  }

  let basePriceCents: number;
  let baseDurationMin: number;
  if (variants.length > 0) {
    const cheapest = variants.reduce((a, b) => (b.priceCents < a.priceCents ? b : a));
    basePriceCents = cheapest.priceCents;
    baseDurationMin = cheapest.durationMin;
  } else if (numOf(formData.get("variant_count")) > 0) {
    return { error: "Vul minstens één variant met een prijs in." };
  } else {
    basePriceCents = centsOf(formData.get("base_price"));
    baseDurationMin = numOf(formData.get("base_duration"));
    if (!(basePriceCents > 0)) return { error: "Vul een prijs in." };
    if (!(baseDurationMin > 0)) return { error: "Vul een duur in." };
  }

  return {
    payload: {
      species,
      name,
      description,
      base_price_cents: basePriceCents,
      base_duration_min: baseDurationMin,
      is_from_price: isFromPrice,
      variants,
      addons,
      per_night: false,
      per_hour: false,
      min_nights: minNights,
      packages: [],
    },
  };
}

/* ── Dienst aanmaken ─────────────────────────────────────────────────────── */
export async function createServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const parsed = parseServiceForm(formData);
  if (parsed.error || !parsed.payload) return { error: parsed.error };

  const { data: prov } = await supabase
    .from("providers")
    .select("category")
    .eq("id", providerId)
    .maybeSingle();

  const { error } = await supabase.from("services").insert({
    provider_id: providerId,
    category: (prov as { category?: string } | null)?.category ?? "",
    required_skills: [],
    buffer_min: 15,
    status: "published",
    price_rules: [],
    ...parsed.payload,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/diensten");
  revalidatePath("/");
  return { success: true };
}

/* ── Dienst bewerken ─────────────────────────────────────────────────────── */
export async function updateServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const serviceId = String(formData.get("service_id") || "");
  if (!serviceId) return { error: "Onbekende dienst." };

  const parsed = parseServiceForm(formData);
  if (parsed.error || !parsed.payload) return { error: parsed.error };

  // RLS beperkt dit al tot eigen diensten; provider-filter als extra zekerheid.
  const { error } = await supabase
    .from("services")
    .update(parsed.payload)
    .eq("id", serviceId)
    .eq("provider_id", providerId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/diensten");
  revalidatePath(`/dashboard/diensten/${serviceId}`);
  revalidatePath("/");
  return { success: true };
}

/* ── Dienst verwijderen ──────────────────────────────────────────────────── */
export async function deleteServiceAction(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = String(formData.get("id") || "");
  if (id) {
    await supabase.from("services").delete().eq("id", id);
    revalidatePath("/dashboard/diensten");
    revalidatePath("/");
  }
}

/* ── Rooster-uitzonderingen (hele dagen dicht) ───────────────────────────── */
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

export async function addExceptionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const date = String(formData.get("date") || "");
  const reason = String(formData.get("reason") || "").trim();
  if (!date) return { error: "Kies een datum." };

  const { error } = await supabase
    .from("schedule_exceptions")
    .upsert({ provider_id: providerId, date, reason }, { onConflict: "provider_id,date" });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/openingstijden");
  revalidatePath("/");
  return { success: true };
}

export async function updateReschedulePolicyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const minHours = Math.max(0, numOf(formData.get("min_hours")));
  const feeCents = Math.max(0, centsOf(formData.get("fee")));

  const { error } = await supabase
    .from("providers")
    .update({ reschedule_min_hours: minHours, reschedule_fee_cents: feeCents })
    .eq("id", providerId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/openingstijden");
  return { success: true };
}

export async function updateSalonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const blurb = String(formData.get("blurb") || "").trim();
  if (!name || !city) return { error: "Vul handelsnaam en stad in." };

  const { error } = await supabase
    .from("providers")
    .update({
      name,
      owner: name,
      category: String(formData.get("category") || "trimsalon"),
      city,
      kvk: String(formData.get("kvk") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      website: String(formData.get("website") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      blurb,
      prikkelarm: formData.get("prikkelarm") === "on",
      mobiel: formData.get("mobiel") === "on",
      skills: formData.getAll("skills").map(String),
    })
    .eq("id", providerId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/instellingen");
  revalidatePath("/");
  revalidatePath(`/aanbieder`);
  return { success: true };
}

export async function removeExceptionAction(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = String(formData.get("id") || "");
  if (id) {
    await supabase.from("schedule_exceptions").delete().eq("id", id);
    revalidatePath("/dashboard/openingstijden");
    revalidatePath("/");
  }
}

/* ── Afspraakstatus wijzigen ─────────────────────────────────────────────── */
export async function setAppointmentStatusAction(formData: FormData) {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !status) return;
  await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("provider_id", providerId);
  revalidatePath("/dashboard");
}

/* ── Handmatige afspraak of blokkade toevoegen ───────────────────────────── */
export async function addManualEntryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const isBlock = formData.get("kind") === "blokkade";
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const durationMin = numOf(formData.get("duration")) || 60;
  const title = String(formData.get("title") || "").trim();
  const owner = String(formData.get("owner") || "").trim();

  if (!date || !time) return { error: "Vul datum en tijd in." };
  if (!title) return { error: isBlock ? "Geef een reden op." : "Vul de naam van het dier in." };

  const startsAt = `${date}T${time}:00${amsterdamOffset(date)}`;

  const { error } = await supabase.from("appointments").insert({
    provider_id: providerId,
    service_id: null,
    is_block: isBlock,
    animal: { name: isBlock ? "Blokkade" : title },
    owner_name: isBlock ? "" : owner,
    service_name: isBlock ? title : String(formData.get("service") || "Afspraak"),
    staff: "",
    starts_at: startsAt,
    duration_min: durationMin,
    price_cents: 0,
    status: "bevestigd",
    intake: {},
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
