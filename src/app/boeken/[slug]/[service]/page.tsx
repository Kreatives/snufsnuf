import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderBySlug, getServiceById, getSavedAnimals } from "@/lib/data";
import { getAvailableSlots } from "@/lib/availability";
import { BookingFlow } from "@/components/booking-flow";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; service: string }>;
}) {
  const { slug, service: serviceId } = await params;
  const provider = await getProviderBySlug(slug);
  const service = await getServiceById(serviceId);
  if (!provider || !service || service.providerId !== provider.id) notFound();

  const shortest = Math.min(...service.pricing.map((p) => p.durationMin));
  const slots = await getAvailableSlots(provider.id, { days: 14, durationMin: shortest });
  const savedAnimals = await getSavedAnimals();

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10">
      <Link
        href={`/aanbieder/${provider.slug}`}
        className="text-[0.9375rem] text-muted hover:text-ink transition-colors"
      >
        ← {provider.name}
      </Link>
      <h1 className="text-display mt-4 mb-8">{service.name} boeken</h1>
      <BookingFlow
        provider={provider}
        service={service}
        slots={slots}
        savedAnimals={savedAnimals}
      />
    </main>
  );
}
