import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider, getServicesByProvider } from "@/lib/data";
import { ServiceEditor } from "@/components/service-editor";
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
    <div className="max-w-[760px]">
      <h1 className="text-h2 mb-8">Aanbod</h1>

      {services.length > 0 && (
        <div className="flex flex-col gap-3 mb-8">
          {services.map((s) => {
            const meta: string[] = [];
            if (s.perNight) meta.push("per nacht");
            else if (s.perHour) meta.push("per uur");
            else if (s.baseDurationMin > 0) meta.push(`vanaf ${formatDuration(s.baseDurationMin)}`);
            if (s.variants.length) meta.push(`${s.variants.length} varianten`);
            if (s.addons.length) meta.push(`${s.addons.length} extra's`);
            if (s.priceRules.some((r) => r.enabled)) meta.push("prijsregels");
            return (
              <article key={s.id} className="card p-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-h3">{s.name}</h3>
                  <p className="text-[0.875rem] text-muted mt-1">
                    {s.isFromPrice ? "vanaf " : ""}
                    {euro(fromPrice(s))}
                    {s.perNight ? " /nacht" : s.perHour ? " /uur" : ""} · {meta.join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboard/diensten/${s.id}`} className="btn btn-ghost h-9 px-4">
                    Bewerken
                  </Link>
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="btn btn-ghost h-9 px-4">
                      Verwijderen
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ServiceEditor />
    </div>
  );
}
