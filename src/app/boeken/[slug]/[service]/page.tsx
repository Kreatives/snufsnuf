import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider, getService, getSlots, savedAnimals } from "@/lib/mock";
import { BookingFlow } from "@/components/booking-flow";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; service: string }>;
}) {
  const { slug, service: serviceId } = await params;
  const provider = getProvider(slug);
  const service = getService(serviceId);
  if (!provider || !service || service.providerId !== provider.id) notFound();

  const slots = getSlots(provider.id);

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
