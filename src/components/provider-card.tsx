import Link from "next/link";
import type { Provider, Slot } from "@/lib/types";
import { getServicesByProvider } from "@/lib/data";
import { getAvailableSlots } from "@/lib/availability";
import { fromPrice, euro } from "@/lib/pricing";

const CATEGORY_LABEL: Record<Provider["category"], string> = {
  trimsalon: "Trimsalon",
  kattentrimsalon: "Kattentrimsalon",
  mobiele_trimmer: "Mobiel, komt aan huis",
  dagopvang: "Dagopvang",
  pension: "Pension",
  uitlaatservice: "Uitlaatservice",
  oppas: "Oppas aan huis",
};

function freeLabel(slot: Slot | undefined): string {
  if (!slot) return "Geen vrije plek";
  const date = new Date(slot.date);
  const day = date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  return `${day}, ${slot.time}`;
}

export async function ProviderCard({ provider }: { provider: Provider }) {
  const [svc, slots] = await Promise.all([
    getServicesByProvider(provider.id),
    getAvailableSlots(provider.id, { days: 14 }),
  ]);
  const cheapest = svc.length ? Math.min(...svc.map(fromPrice)) : 0;

  return (
    <article className="card overflow-hidden flex flex-col">
      <Link href={`/aanbieder/${provider.slug}`} className="block aspect-[16/10]" aria-label={provider.name}>
        {provider.photos[0] || provider.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={provider.photos[0] ?? provider.logoUrl ?? ""}
            alt={provider.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="media-ph block w-full h-full" aria-hidden />
        )}
      </Link>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-h3">
              <Link href={`/aanbieder/${provider.slug}`} className="hover:underline underline-offset-4">
                {provider.name}
              </Link>
            </h3>
            <p className="text-eyebrow mt-0.5">
              {CATEGORY_LABEL[provider.category]} · {provider.city} · {provider.distanceKm} km
            </p>
          </div>
          <span className="chip shrink-0">
            {provider.rating.toFixed(1)} · {provider.reviewCount}
          </span>
        </div>

        <p className="text-[0.9375rem] text-muted line-clamp-2">{provider.blurb}</p>

        <div className="flex flex-wrap gap-1.5">
          {provider.prikkelarm && <span className="chip">Prikkelarm</span>}
          {provider.skills.includes("angsthond") && <span className="chip">Angsthond</span>}
          {provider.skills.includes("kat") && <span className="chip">Katten</span>}
          {provider.mobiel && <span className="chip">Aan huis</span>}
        </div>

        <div className="mt-auto pt-3 border-t border-line flex items-end justify-between">
          <div>
            <p className="text-eyebrow">Vanaf</p>
            <p className="text-h3">{svc.length ? euro(cheapest) : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-eyebrow">Eerst vrij</p>
            <p className="text-[0.9375rem] font-medium">{freeLabel(slots[0])}</p>
          </div>
        </div>

        <Link href={`/aanbieder/${provider.slug}`} className="btn btn-primary w-full">
          Bekijk en boek
        </Link>
      </div>
    </article>
  );
}
