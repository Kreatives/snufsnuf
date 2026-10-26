import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getProviderHours } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
import { HoursForm } from "@/components/hours-form";

export default async function OpeningstijdenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const hours = await getProviderHours(provider.id);

  return (
    <main className="mx-auto max-w-[760px] px-6 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <h1 className="text-h2">Openingstijden</h1>
        <DashboardNav active="/dashboard/openingstijden" />
      </div>
      <HoursForm existing={hours} />
    </main>
  );
}
