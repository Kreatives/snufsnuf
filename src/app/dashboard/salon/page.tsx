import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider } from "@/lib/data";
import { SalonForm } from "@/components/salon-form";
import { PhotoManager } from "@/components/photo-manager";

export default async function SalonPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  return (
    <div className="max-w-[760px] flex flex-col gap-10">
      <h1 className="text-h2">Mijn salon</h1>

      <section>
        <h2 className="text-h3 mb-1">Saloninformatie</h2>
        <p className="text-muted text-[0.9375rem] mb-4">Dit is wat baasjes op de marktplaats zien.</p>
        <SalonForm provider={provider} />
      </section>

      <section>
        <h2 className="text-h3 mb-1">Foto&apos;s</h2>
        <p className="text-muted text-[0.9375rem] mb-4">Een profielfoto en werkfoto&apos;s van je salon.</p>
        <PhotoManager providerId={provider.id} logoUrl={provider.logoUrl} photos={provider.photos} />
      </section>
    </div>
  );
}
