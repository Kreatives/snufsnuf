import { getProviders, getProviderMinPrices } from "@/lib/data";
import { ProviderCard } from "@/components/provider-card";
import { AirbnbSearch } from "@/components/airbnb-search";
import { SearchMap, type MapItem } from "@/components/search-map";
import { cityCoords } from "@/lib/geo";
import { euro } from "@/lib/pricing";

const GREEN = "#1F3A2E";
const MUTED = "#5B6B61";
const LINE = "#E7E6E0";

export default async function ZoekenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; loc?: string; cat?: string; date?: string }>;
}) {
  const { q = "", loc = "", cat = "", date = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const location = loc.trim().toLowerCase();
  // Kaart pas tonen nadat er is gezocht (een filter is ingevuld).
  const hasSearched = Boolean(query || location || cat || date);

  const [all, minPrices] = await Promise.all([getProviders(), getProviderMinPrices()]);
  const providers = all.filter((p) => {
    const haystack = [p.name, p.category, p.city, p.blurb, ...(p.skills ?? [])]
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesLoc = !location || p.city.toLowerCase().includes(location);
    const matchesCat = !cat || p.category === cat;
    return matchesQuery && matchesLoc && matchesCat;
  });

  const mapItems: MapItem[] = providers.map((p) => {
    const [lat, lng] = cityCoords(p.city, p.slug);
    const cents = minPrices[p.id];
    return {
      slug: p.slug,
      name: p.name,
      city: p.city,
      lat,
      lng,
      price: cents != null ? euro(cents) : "Prijs op aanvraag",
    };
  });

  return (
    <main style={{ background: "#fff", color: GREEN }}>
      <AirbnbSearch loc={loc} date={date} cat={cat} />

      <div className="mx-auto max-w-[1680px] w-full px-5 sm:px-8 pb-16">
        <div className={hasSearched ? "lg:grid lg:grid-cols-[1fr_minmax(360px,600px)] lg:gap-8" : ""}>
          {/* Lijst */}
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <h1 className="text-h2" style={{ color: GREEN }}>
                {providers.length}{" "}
                {providers.length === 1 ? "aanbieder" : "aanbieders"}
                {location ? ` in ${loc}` : " in Nederland"}
              </h1>
            </div>

            {providers.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "#fff", border: `1px solid ${LINE}`, color: MUTED }}
              >
                <p className="text-[1.0625rem]" style={{ color: GREEN }}>
                  Geen aanbieders gevonden{location ? ` in ${loc}` : ""}.
                </p>
                <p className="mt-2 text-[0.9375rem]">Pas je plaats of soort zorg aan.</p>
              </div>
            ) : (
              <div
                className={`grid gap-6 sm:grid-cols-2 ${hasSearched ? "" : "lg:grid-cols-3"}`}
              >
                {providers.map((p) => (
                  <ProviderCard key={p.id} provider={p} />
                ))}
              </div>
            )}
          </section>

          {/* Kaart — pas na een zoekopdracht, sticky naast de lijst, verborgen op mobiel */}
          {hasSearched && (
            <aside className="hidden lg:block">
              <div className="sticky top-[84px] h-[calc(100vh-108px)]">
                <SearchMap items={mapItems} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
