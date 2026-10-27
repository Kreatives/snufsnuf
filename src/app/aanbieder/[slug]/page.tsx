import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug, getServicesByProvider } from "@/lib/data";
import { getAvailableSlots } from "@/lib/availability";
import { fromPrice, euro, formatDuration } from "@/lib/pricing";
import { SlotCalendar } from "@/components/slot-calendar";

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) notFound();

  const svc = await getServicesByProvider(provider.id);
  const slots = await getAvailableSlots(provider.id, { days: 14 });

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <Link href="/" className="text-[0.9375rem] text-muted hover:text-ink transition-colors">
        ← Terug naar zoeken
      </Link>

      <div className="media-ph aspect-[21/9] rounded-lg mt-5" aria-hidden />

      <div className="grid lg:grid-cols-12 gap-10 mt-8">
        <div className="lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-display">{provider.name}</h1>
              <p className="text-eyebrow mt-2">
                {provider.city} · {provider.distanceKm} km · {provider.rating.toFixed(1)} uit{" "}
                {provider.reviewCount} reviews
              </p>
            </div>
          </div>

          <p className="mt-5 text-[1.0625rem] text-muted max-w-[60ch]">{provider.blurb}</p>

          <div className="flex flex-wrap gap-1.5 mt-5">
            {provider.prikkelarm && <span className="chip">Prikkelarm</span>}
            {provider.skills.map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
            {provider.mobiel && <span className="chip">Komt aan huis</span>}
          </div>

          <h2 className="text-h2 mt-12 mb-5">Diensten</h2>
          <div className="flex flex-col gap-4">
            {svc.map((service) => (
              <div key={service.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-h3">{service.name}</h3>
                    <p className="text-[0.9375rem] text-muted mt-1 max-w-[52ch]">
                      {service.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-eyebrow">{service.isFromPrice ? "Vanaf" : "Prijs"}</p>
                    <p className="text-h3">
                      {euro(fromPrice(service))}
                      {service.perNight && (
                        <span className="text-[0.875rem] text-muted font-normal"> /nacht</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-line flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-[0.875rem] text-muted">
                    {service.perNight
                      ? "Meerdaags verblijf, prijs per nacht"
                      : service.baseDurationMin > 0
                        ? `Vanaf ${formatDuration(service.baseDurationMin)}`
                        : ""}
                  </p>
                  <Link href={`/boeken/${provider.slug}/${service.id}`} className="btn btn-primary">
                    {service.perNight ? "Boek verblijf" : "Boek deze dienst"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="card p-5 lg:sticky lg:top-24">
            <h2 className="text-h3 mb-1">Beschikbaarheid</h2>
            <p className="text-[0.875rem] text-muted mb-5">
              Eerstvolgende vrije momenten, live uit de agenda.
            </p>
            <SlotCalendar
              slots={slots}
              linkBase={`/boeken/${provider.slug}/${svc[0]?.id}`}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
