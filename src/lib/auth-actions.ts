"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SizeClass, CoatType } from "./types";

export interface ActionState {
  error?: string;
  success?: boolean;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/* ── Registreren ─────────────────────────────────────────────────────────── */
export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const role = String(formData.get("role") || "baasje");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  if (!email || password.length < 6) {
    return { error: "Vul een e-mailadres in en een wachtwoord van minstens 6 tekens." };
  }

  // Maak de gebruiker meteen bevestigd aan (prototype: geen e-mailbevestiging nodig).
  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, display_name: name },
  });
  if (createErr) {
    if (/already|exists|registered/i.test(createErr.message)) {
      return { error: "Er bestaat al een account met dit e-mailadres. Log direct in." };
    }
    return { error: createErr.message };
  }

  // Zorg dat het profiel bestaat (de trigger vuurt niet altijd op admin.createUser).
  if (created.user) {
    await admin
      .from("profiles")
      .upsert({ id: created.user.id, role, display_name: name }, { onConflict: "id" });
  }

  // Direct inloggen zodat de sessiecookie meteen wordt gezet.
  const supabase = await createClient(await cookies());
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signErr) redirect("/inloggen");

  redirect(role === "aanbieder" ? "/dashboard/onboarding" : "/mijn-dieren");
}

/* ── Inloggen ────────────────────────────────────────────────────────────── */
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient(await cookies());
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Inloggen mislukt. Controleer je gegevens." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  redirect(profile?.role === "aanbieder" ? "/dashboard" : "/mijn-dieren");
}

/* ── Accountgegevens opslaan ─────────────────────────────────────────────── */
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name, phone })
    .eq("id", user!.id);
  if (error) return { error: error.message };

  revalidatePath("/mijn-account");
  return { success: true };
}

/* ── Uitloggen ───────────────────────────────────────────────────────────── */
export async function logoutAction() {
  const supabase = await createClient(await cookies());
  await supabase.auth.signOut();
  redirect("/");
}

/* ── Salon aanmaken (aanbieder-onboarding) ───────────────────────────────── */
export async function createProviderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "trimsalon");
  const city = String(formData.get("city") || "").trim();
  const kvk = String(formData.get("kvk") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const postalCode = String(formData.get("postalCode") || "").trim();
  const blurb = String(formData.get("blurb") || "").trim();
  const prikkelarm = formData.get("prikkelarm") === "on";
  const mobiel = formData.get("mobiel") === "on";
  const skills = formData.getAll("skills").map(String);

  if (!name || !city) {
    return { error: "Vul in elk geval een handelsnaam en stad in." };
  }

  const species = category === "kattentrimsalon" ? ["kat"] : ["hond"];
  const baseSlug = slugify(name) || "salon";

  // Probeer een nette slug; bij botsing een korte suffix.
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug}-${user!.id.slice(0, 4)}${attempt > 1 ? `-${attempt}` : ""}`;
    const { data, error } = await supabase
      .from("providers")
      .insert({
        owner_user_id: user!.id,
        slug,
        name,
        category,
        owner: name,
        city,
        kvk,
        phone,
        website,
        address,
        postal_code: postalCode,
        blurb,
        species,
        skills,
        prikkelarm,
        mobiel,
        status: "actief",
      })
      .select("id")
      .single();
    if (!error && data) {
      // Nieuwe salon start met een leeg aanbod; de aanbieder voegt zelf producten toe.
      const cookieStore = await cookies();
      cookieStore.set("active_salon", (data as { id: string }).id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      revalidatePath("/");
      redirect("/dashboard");
    }
    if (error && error.code !== "23505") return { error: error.message };
  }
  return { error: "Kon de salon niet aanmaken, probeer een andere naam." };
}

/* ── Dier toevoegen (baasje) ─────────────────────────────────────────────── */
export async function addAnimalAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/inloggen");

  const name = String(formData.get("name") || "").trim();
  const species = String(formData.get("species") || "hond");
  const breed = String(formData.get("breed") || "").trim() || null;
  const sizeClass = String(formData.get("size_class") || "m") as SizeClass;
  const coatType = String(formData.get("coat_type") || "glad") as CoatType;
  const weightRaw = String(formData.get("weight_kg") || "").trim();
  const behaviorRaw = String(formData.get("behavior") || "sociaal");
  const biteRisk = Number(formData.get("bite_risk") || 0);
  const medicalNote = String(formData.get("medical_note") || "").trim() || null;
  const topNote = String(formData.get("top_note") || "").trim() || null;

  if (!name) return { error: "Geef je dier een naam." };

  const { error } = await supabase.from("animals").insert({
    owner_user_id: user!.id,
    name,
    species,
    breed,
    size_class: sizeClass,
    coat_type: coatType,
    weight_kg: weightRaw ? Number(weightRaw) : null,
    behavior: [behaviorRaw],
    bite_risk: biteRisk,
    muzzle_required: biteRisk >= 2,
    medical_note: medicalNote,
    top_note: topNote,
  });
  if (error) return { error: error.message };

  revalidatePath("/mijn-dieren");
  return { success: true };
}
