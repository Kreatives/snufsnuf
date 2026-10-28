import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getProviderHours, getProviderExceptions } from "@/lib/data";
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
    <div className="max-w-[760px]">
      <h1 className="text-h2 mb-8">Openingstijden</h1>
      <div className="flex flex-col gap-6">
        <HoursForm existing={hours} />
        <ExceptionsManager existing={exceptions} />
        <ReschedulePolicyForm
          minHours={provider.rescheduleMinHours}
          feeCents={provider.rescheduleFeeCents}
        />
      </div>
    </div>
  );
}
