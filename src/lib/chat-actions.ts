"use server";

// Zoek-actie achter de chat-widget. Gebruikt dezelfde datalaag + prijsmotor als
// /zoeken, zodat de widget écht aanbieders uit Supabase teruggeeft (geen script).

import { getProviders, getProviderMinPrices } from "./data";
import { euro } from "./pricing";
import type { ProviderCategory, Species } from "./types";

const CATEGORY_LABEL: Record<ProviderCategory, string> = {
  trimsalon: "Trimsalon",
  kattentrimsalon: "Kattentrimsalon",
  mobiele_trimmer: "Mobiel, aan huis",
  dagopvang: "Dagopvang",
  pension: "Pension",
  uitlaatservice: "Uitlaatservice",
  oppas: "Oppas aan huis",
};

export interface ChatResult {
  slug: string;
  name: string;
  city: string;
  categoryLabel: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  logoUrl: string | null;
}

/**
 * Welke zorgsoorten en steden écht in de data zitten. Hiermee toont de widget
 * alleen snelknoppen die ook daadwerkelijk iemand opleveren.
 */
export async function getChatFacets(): Promise<{ categories: ProviderCategory[]; cities: string[] }> {
  const all = await getProviders();
  const categories = Array.from(new Set(all.map((p) => p.category)));
  const freq = new Map<string, number>();
  for (const p of all) freq.set(p.city, (freq.get(p.city) ?? 0) + 1);
  const cities = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city]) => city)
    .slice(0, 5);
  return { categories, cities };
}

export async function searchProviders(input: {
  categories?: ProviderCategory[];
  city?: string;
  species?: Species | null;
}): Promise<ChatResult[]> {
  const categories = input.categories ?? [];
  const city = (input.city ?? "").trim().toLowerCase();
  const species = input.species ?? null;

  const [all, minPrices] = await Promise.all([getProviders(), getProviderMinPrices()]);

  const matches = all.filter((p) => {
    const matchesCat = categories.length === 0 || categories.includes(p.category);
    const matchesCity = !city || p.city.toLowerCase().includes(city);
    const matchesSpecies = !species || (p.species ?? []).includes(species);
    return matchesCat && matchesCity && matchesSpecies;
  });

  // Beste eerst: hoogste rating, dan meeste reviews, dan dichtstbij.
  matches.sort(
    (a, b) =>
      b.rating - a.rating ||
      b.reviewCount - a.reviewCount ||
      a.distanceKm - b.distanceKm,
  );

  return matches.slice(0, 4).map((p) => {
    const cents = minPrices[p.id];
    return {
      slug: p.slug,
      name: p.name,
      city: p.city,
      categoryLabel: CATEGORY_LABEL[p.category],
      rating: p.rating,
      reviewCount: p.reviewCount,
      priceLabel: cents != null ? `vanaf ${euro(cents)}` : "Prijs op aanvraag",
      logoUrl: p.logoUrl,
    };
  });
}
