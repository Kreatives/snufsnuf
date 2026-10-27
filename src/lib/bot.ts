// Contract voor de WhatsApp-assistent / zoekfunctie. Gebruikt exact dezelfde prijslogica
// als de boekingsflow (calculateQuote), zodat prijzen nergens dubbel worden berekend.

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getServiceById, getServicesByProvider } from "./data";
import { calculateQuote, type Quote } from "./quote";
import type { SizeClass, CoatType } from "./types";

/** Quote voor een dienst + dier, met optioneel gekozen variant en extra's. */
export async function getQuote(
  serviceId: string,
  petId: string | null,
  variantId?: string | null,
  addonIds?: string[],
): Promise<Quote | null> {
  const service = await getServiceById(serviceId);
  if (!service) return null;

  let pet = {} as { size?: SizeClass; coat?: CoatType; weightKg?: number | null };
  if (petId) {
    const supabase = await createClient(await cookies());
    const { data } = await supabase
      .from("animals")
      .select("size_class, coat_type, weight_kg")
      .eq("id", petId)
      .maybeSingle();
    if (data) {
      const a = data as { size_class: SizeClass; coat_type: CoatType; weight_kg: number | null };
      pet = { size: a.size_class, coat: a.coat_type, weightKg: a.weight_kg };
    }
  }

  return calculateQuote(service, pet, {
    variantId: variantId ?? null,
    addons: (addonIds ?? []).map((id) => ({ addonId: id, quantity: 1 })),
  });
}

/** Lijst van diensten met basisprijs, zodat de bot altijd "vanaf €X" kan zeggen. */
export async function listServices(providerId: string) {
  const services = await getServicesByProvider(providerId);
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    basePriceCents: s.basePriceCents,
    isFromPrice: s.isFromPrice,
    perNight: s.perNight,
  }));
}
