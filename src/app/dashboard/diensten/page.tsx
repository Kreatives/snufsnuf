import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getServicesByProvider } from "@/lib/data";
import { DashboardNav } from "@/components/dashboard-nav";
import { AddServiceForm } from "@/components/add-service-form";
import { deleteServiceAction } from "@/lib/provider-actions";
import { fromPrice, euro, formatDuration } from "@/lib/pricing";

export default async function DienstenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  const services = await getServicesByProvider(provider.id);

  return (
    <main className="mx-auto max-w-[760px] px-6 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <h1 className="text-h2">Diensten</h1>
        <DashboardNav active="/dashboard/diensten" />
      </div>

      {services.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {services.map((s) => {
            const durs = s.pricing.map((p) => p.durationMin);
            return (
              <article key={s.id} className="card p-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-h3">{s.name}</h3>
                  <p className="text-[0.875rem] text-muted mt-1">
                    {s.indicative ? "vanaf " : ""}
                    {euro(fromPrice(s))} · {formatDuration(Math.min(...durs))} tot{" "}
                    {formatDuration(Math.max(...durs))} · {s.pricing.length} maten
                  </p>
                </div>
                <form action={deleteServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="btn btn-ghost h-9 px-4">
                    Verwijderen
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}

      <AddServiceForm />
    </main>
  );
}
