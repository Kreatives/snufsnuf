"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionState } from "./auth-actions";
import type { SizeClass, Addon } from "./types";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // ma..zo
const SIZES: SizeClass[] = ["xs", "s", "m", "l", "xl"];

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

/* ── Dienst toevoegen ────────────────────────────────────────────────────── */
export async function addServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const species = String(formData.get("species") || "hond");
  const bufferMin = Number(formData.get("buffer_min") || 15);
  const indicative = formData.get("indicative") === "on";

  if (!name) return { error: "Geef de dienst een naam." };

  const pricing: { sizeClass: SizeClass; priceCents: number; durationMin: number }[] = [];
  for (const size of SIZES) {
    const euros = Number(String(formData.get(`price_${size}`) || "").replace(",", "."));
    const dur = Number(formData.get(`dur_${size}`) || 0);
    if (euros > 0 && dur > 0) {
      pricing.push({ sizeClass: size, priceCents: Math.round(euros * 100), durationMin: dur });
    }
  }
  if (pricing.length === 0) {
    return { error: "Vul voor minstens één maat een prijs en duur in." };
  }

  const { error } = await supabase.from("services").insert({
    provider_id: providerId,
    species,
    name,
    description,
    pricing,
    coat_surcharge: {},
    breed_exceptions: [],
    required_skills: [],
    buffer_min: bufferMin,
    indicative,
    status: "published",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/diensten");
  revalidatePath("/");
  return { success: true };
}

/* ── Oppas-pakket toevoegen (dagtarief + upsells) ────────────────────────── */
export async function addPackageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const species = String(formData.get("species") || "hond");
  const dayEuros = Number(String(formData.get("day_price") || "").replace(",", "."));

  if (!name) return { error: "Geef het pakket een naam." };
  if (!(dayEuros > 0)) return { error: "Vul een dagtarief in." };

  const addonNames = formData.getAll("addon_name").map(String);
  const addonPrices = formData.getAll("addon_price").map(String);
  const addons: Addon[] = [];
  for (let i = 0; i < addonNames.length; i++) {
    const n = addonNames[i].trim();
    const p = Number(addonPrices[i].replace(",", "."));
    if (n && p > 0) addons.push({ name: n, priceCents: Math.round(p * 100) });
  }

  const { error } = await supabase.from("services").insert({
    provider_id: providerId,
    species,
    name,
    description,
    pricing: [],
    coat_surcharge: {},
    breed_exceptions: [],
    required_skills: [],
    buffer_min: 0,
    indicative: false,
    status: "published",
    pricing_mode: "per_dag",
    day_price_cents: Math.round(dayEuros * 100),
    addons,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/diensten");
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
