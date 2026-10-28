import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getOwnedProvider } from "@/lib/data";
import { AccountForm } from "@/components/account-form";
import { SalonForm } from "@/components/salon-form";

export default async function InstellingenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/inloggen");
  if (user.role !== "aanbieder") redirect("/mijn-dieren");

  const provider = await getOwnedProvider();
  if (!provider) redirect("/dashboard/onboarding");

  return (
    <div className="max-w-[760px] flex flex-col gap-10">
      <h1 className="text-h2">Instellingen</h1>

      <section>
        <h2 className="text-h3 mb-1">Persoonlijke informatie</h2>
        <p className="text-muted text-[0.9375rem] mb-4">Je eigen contactgegevens.</p>
        <AccountForm name={user.name ?? ""} email={user.email ?? ""} phone={user.phone ?? ""} />
      </section>

      <section>
        <h2 className="text-h3 mb-1">Saloninformatie</h2>
        <p className="text-muted text-[0.9375rem] mb-4">
          Dit is wat baasjes op de marktplaats zien.
        </p>
        <SalonForm provider={provider} />
      </section>

      <section>
        <h2 className="text-h3 mb-1">Foto&apos;s</h2>
        <p className="text-muted text-[0.9375rem] mb-4">
          Een profielfoto en werkfoto&apos;s van je salon.
        </p>
        <div className="card p-6 flex items-center gap-4">
          <span className="media-ph size-16 rounded-lg shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Foto-upload komt binnenkort</p>
            <p className="text-[0.875rem] text-muted">
              Hier kun je straks een logo en werkfoto&apos;s uploaden.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
