"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionState } from "./auth-actions";
import type { SizeClass, CoatType, Variant, Addon, PriceRule } from "./types";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // ma..zo
const SIZES: SizeClass[] = ["xs", "s", "m", "l", "xl"];
const COATS: CoatType[] = ["glad", "lang", "krul", "ruw", "dubbel"];
const ROWS = [0, 1, 2];

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

/* ── Dienst aanmaken (flexibel model: basis + varianten + extra's + prijsregels) ── */
export async function createServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const providerId = await ownerProviderId(supabase);
  if (!providerId) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const species = String(formData.get("species") || "hond");
  const basePriceCents = centsOf(formData.get("base_price"));
  const perNight = formData.get("per_night") === "on";
  const baseDurationMin = perNight ? 0 : numOf(formData.get("base_duration"));
  const isFromPrice = formData.get("is_from_price") === "on";
  const minNights = Math.max(1, numOf(formData.get("min_nights")) || 1);

  if (!name) return { error: "Geef de dienst een naam." };
  if (!(basePriceCents > 0)) return { error: "Vul een basisprijs in." };
  if (!perNight && !(baseDurationMin > 0)) return { error: "Vul een basisduur in." };

  const { data: prov } = await supabase
    .from("providers")
    .select("category")
    .eq("id", providerId)
    .maybeSingle();

  const variants: Variant[] = [];
  for (const i of ROWS) {
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

  const addons: Addon[] = [];
  for (const i of ROWS) {
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

  const priceRules: PriceRule[] = [];
  if (formData.get("rule_size") === "on") {
    priceRules.push({
      id: uid(),
      attribute: "size",
      enabled: true,
      rows: SIZES.map((s) => ({
        value: s,
        deltaPriceCents: centsOf(formData.get(`size_price_${s}`)),
        deltaDurationMin: numOf(formData.get(`size_dur_${s}`)),
      })),
    });
  }
  if (formData.get("rule_coat") === "on") {
    priceRules.push({
      id: uid(),
      attribute: "coat",
      enabled: true,
      rows: COATS.map((c) => ({
        value: c,
        deltaPriceCents: centsOf(formData.get(`coat_price_${c}`)),
        deltaDurationMin: numOf(formData.get(`coat_dur_${c}`)),
      })),
    });
  }
  if (formData.get("rule_weight") === "on") {
    const rows = ROWS.map((i) => ({
      value: String(formData.get(`weight_val_${i}`) || "").trim(),
      deltaPriceCents: centsOf(formData.get(`weight_price_${i}`)),
      deltaDurationMin: numOf(formData.get(`weight_dur_${i}`)),
    })).filter((r) => r.value !== "");
    if (rows.length > 0)
      priceRules.push({ id: uid(), attribute: "weight", enabled: true, rows });
  }

  const { error } = await supabase.from("services").insert({
    provider_id: providerId,
    species,
    name,
    category: (prov as { category?: string } | null)?.category ?? "",
    description,
    base_price_cents: basePriceCents,
    base_duration_min: baseDurationMin,
    is_from_price: isFromPrice,
    variants,
    addons,
    price_rules: priceRules,
    per_night: perNight,
    min_nights: minNights,
    required_skills: [],
    buffer_min: 15,
    status: "published",
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
