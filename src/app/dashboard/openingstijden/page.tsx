import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getProviderHours, getProviderExceptions } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
import { HoursForm } from "@/components/hours-form";
import { ExceptionsManager } from "@/components/exceptions-manager";
import { ReschedulePolicyForm } from "@/components/reschedule-policy-form";

export default async function OpeningstijdenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const [hours, exceptions] = await Promise.all([
    getProviderHours(provider.id),
    getProviderExceptions(provider.id),
  ]);

  return (
    <main className="mx-auto max-w-[760px] px-6 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <h1 className="text-h2">Openingstijden</h1>
        <DashboardNav active="/dashboard/openingstijden" />
      </div>
      <div className="flex flex-col gap-6">
        <HoursForm existing={hours} />
        <ExceptionsManager existing={exceptions} />
        <ReschedulePolicyForm
          minHours={provider.rescheduleMinHours}
          feeCents={provider.rescheduleFeeCents}
        />
      </div>
    </main>
  );
}
