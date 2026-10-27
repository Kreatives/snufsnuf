import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getServiceById } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
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
    <main className="mx-auto max-w-[760px] px-6 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <h1 className="text-h2">Dienst bewerken</h1>
        <DashboardNav active="/dashboard/diensten" />
      </div>
      <Link
        href="/dashboard/diensten"
        className="text-[0.9375rem] text-muted hover:text-ink transition-colors mb-5 inline-block"
      >
        ← Alle diensten
      </Link>
      <ServiceEditor initial={service} />
    </main>
  );
}
