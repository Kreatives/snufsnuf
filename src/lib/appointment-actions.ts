"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionState } from "./auth-actions";

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

interface ApptRow {
  id: string;
  provider_id: string;
  owner_user_id: string | null;
  duration_min: number;
  status: string;
  starts_at: string;
}

/** Laadt de afspraak en bepaalt of de ingelogde gebruiker 'm mag beheren. */
async function authorize(
  supabase: SupabaseClient,
  id: string,
): Promise<{ appt: ApptRow; isProvider: boolean } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !id) return null;

  const { data } = await supabase
    .from("appointments")
    .select("id, provider_id, owner_user_id, duration_min, status, starts_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const appt = data as ApptRow;

  if (appt.owner_user_id === user.id) return { appt, isProvider: false };

  const { data: prov } = await supabase
    .from("providers")
    .select("owner_user_id")
    .eq("id", appt.provider_id)
    .maybeSingle();
  if ((prov as { owner_user_id: string } | null)?.owner_user_id === user.id) {
    return { appt, isProvider: true };
  }
  return null;
}

/** Controleert of een nieuw moment binnen de agenda past (openingstijden, geen overlap). */
async function validateSlot(
  supabase: SupabaseClient,
  providerId: string,
  date: string,
  time: string,
  durationMin: number,
  excludeId: string,
): Promise<string | null> {
  const [hh, mm] = time.split(":").map(Number);
  const startMin = hh * 60 + mm;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();

  const { data: closed } = await supabase
    .from("schedule_exceptions")
    .select("id")
    .eq("provider_id", providerId)
    .eq("date", date)
    .maybeSingle();
  if (closed) return "De salon is op die dag gesloten.";

  const { data: hoursRows } = await supabase
    .from("provider_hours")
    .select("weekday, open_time, close_time")
    .eq("provider_id", providerId)
    .eq("weekday", weekday);
  const h = (hoursRows as { open_time: string; close_time: string }[] | null)?.[0];
  if (!h) return "De salon is op die dag dicht.";
  const [oh, om] = h.open_time.split(":").map(Number);
  const [ch, cm] = h.close_time.split(":").map(Number);
  if (startMin < oh * 60 + om || startMin + durationMin > ch * 60 + cm) {
    return "Dat tijdstip valt buiten de openingstijden.";
  }

  const startsAt = `${date}T${time}:00${amsterdamOffset(date)}`;
  const startMs = Date.parse(startsAt);
  const endMs = startMs + durationMin * 60000;
  const { data: others } = await supabase
    .from("appointments")
    .select("id, starts_at, duration_min, status")
    .eq("provider_id", providerId)
    .gte("starts_at", new Date(startMs - 24 * 60 * 60 * 1000).toISOString())
    .lt("starts_at", new Date(endMs).toISOString());
  const clash = (
    others as { id: string; starts_at: string; duration_min: number; status: string }[] | null
  )?.some((a) => {
    if (a.id === excludeId) return false;
    if (a.status === "geannuleerd" || a.status === "no_show") return false;
    const aStart = Date.parse(a.starts_at);
    return aStart < endMs && aStart + a.duration_min * 60000 > startMs;
  });
  if (clash) return "Dat moment botst met een andere afspraak.";

  return null;
}

/* ── Annuleren (consument of aanbieder) ──────────────────────────────────── */
export async function cancelAppointmentAction(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = String(formData.get("id") || "");
  const auth = await authorize(supabase, id);
  if (!auth) return;

  await supabase.from("appointments").update({ status: "geannuleerd" }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/mijn-afspraken");
}

/* ── Verplaatsen (met agenda-validatie) ──────────────────────────────────── */
export async function rescheduleAppointmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient(await cookies());
  const id = String(formData.get("id") || "");
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  if (!date || !time) return { error: "Kies een datum en tijd." };

  const auth = await authorize(supabase, id);
  if (!auth) return { error: "Niet toegestaan." };
  if (auth.appt.status === "geannuleerd") return { error: "Een geannuleerde afspraak kun je niet verplaatsen." };

  const problem = await validateSlot(
    supabase,
    auth.appt.provider_id,
    date,
    time,
    auth.appt.duration_min,
    id,
  );
  if (problem) return { error: problem };

  const startsAt = `${date}T${time}:00${amsterdamOffset(date)}`;
  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: startsAt, provider_moved: auth.isProvider })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/mijn-afspraken");
  return { success: true };
}

/* ── Verwijderen (alleen aanbieder) ──────────────────────────────────────── */
export async function deleteAppointmentAction(formData: FormData) {
  const supabase = await createClient(await cookies());
  const id = String(formData.get("id") || "");
  const auth = await authorize(supabase, id);
  if (!auth || !auth.isProvider) return;

  await supabase.from("appointments").delete().eq("id", id);
  revalidatePath("/dashboard");
}
