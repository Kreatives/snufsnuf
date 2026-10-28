import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getServiceById } from "@/lib/data";
import { ServiceEditor } from "@/components/service-editor";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const { id } = await params;
  const service = await getServiceById(id);
  if (!service || service.providerId !== provider.id) notFound();

  return (
    <div className="max-w-[760px]">
      <h1 className="text-h2 mb-4">Product bewerken</h1>
      <Link
        href="/dashboard/diensten"
        className="text-[0.9375rem] text-muted hover:text-ink transition-colors mb-5 inline-block"
      >
        ← Alle producten
      </Link>
      <ServiceEditor initial={service} />
    </div>
  );
}
